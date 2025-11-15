const fs = require('fs');
const path = require('path');
const HiveService = require('./hive');
const DatabaseService = require('./database');
const EncryptionService = require('./encryption');
const logger = require('./logger');

class VotingService {
  constructor(masterPassword) {
    this.hiveService = new HiveService();
    this.dbService = new DatabaseService();
    this.encryptionService = new EncryptionService();
    this.masterPassword = masterPassword;
    this.isRunning = false;
    this.lastBlockFile = path.join(__dirname, '../lastblock.txt');
    this.pendingVotes = new Map(); // Store delayed votes
  }

  // Start the voting bot
  async start() {
    if (this.isRunning) {
      throw new Error('Bot is already running');
    }

    this.isRunning = true;
    this.dbService.updateBotStatus(1);

    // Get starting block
    let startBlock = await this.getLastProcessedBlock();
    if (!startBlock) {
      startBlock = await this.hiveService.getCurrentBlockNumber();
      this.saveLastProcessedBlock(startBlock);
    }

    logger.success(`Bot started from block ${startBlock}`);
    
    // Start block streaming
    this.streamBlocks(startBlock);
  }

  // Stop the voting bot
  stop() {
    this.isRunning = false;
    this.dbService.updateBotStatus(0);
    logger.info('Bot stopped');
  }

  // Stream blockchain blocks
  async streamBlocks(startBlock) {
    try {
      await this.hiveService.streamBlocks(startBlock, async (block) => {
        if (!this.isRunning) {
          return;
        }

        await this.processBlock(block);
        
        // Save last processed block
        this.saveLastProcessedBlock(block.block_id);
        this.dbService.updateBotStatus(1, block.block_id);
      });
    } catch (error) {
      console.error('Streaming error:', error);
      this.isRunning = false;
      this.dbService.updateBotStatus(0);
      
      // Retry after 30 seconds
      if (this.isRunning) {
        logger.warning('Connection lost. Reconnecting in 30 seconds...');
        setTimeout(() => this.start(), 30000);
      }
    }
  }

  // Process a single block
  async processBlock(block) {
    const operations = this.hiveService.processBlockOperations(block);
    
    for (const op of operations) {
      if (op.type === 'comment') {
        await this.handleCommentOperation(op);
      }
    }

    // Process pending delayed votes
    await this.processPendingVotes();
  }

  // Handle comment (post or reply) operations
  async handleCommentOperation(op) {
    const { author, permlink, isPost } = op;
    
    // Check Good List (only active items)
    const goodListEntry = this.dbService.getGoodList().find(item => item.username === author && item.active === 1);
    if (goodListEntry) {
      // Skip if it's a comment and include_comments is disabled
      if (!isPost && !goodListEntry.include_comments) {
        logger.info(`Skipping comment from @${author} (Good List, comments disabled)`);
        return;
      }
      
      logger.detect(`Detected ${isPost ? 'post' : 'comment'} from @${author} (Good List)`);
      await this.scheduleVote(author, permlink, goodListEntry, 'good');
    }

    // Check Shit List (only active items)
    const shitListEntry = this.dbService.getShitList().find(item => item.username === author && item.active === 1);
    if (shitListEntry) {
      // Skip if it's a comment and include_comments is disabled
      if (!isPost && !shitListEntry.include_comments) {
        logger.info(`Skipping comment from @${author} (Shit List, comments disabled)`);
        return;
      }
      
      logger.detect(`Detected ${isPost ? 'post' : 'comment'} from @${author} (Shit List)`);
      await this.scheduleVote(author, permlink, shitListEntry, 'shit');
    }
  }

  // Schedule a vote with delay
  async scheduleVote(author, permlink, listEntry, listType) {
    const voteKey = `${author}/${permlink}/${listType}`;
    
    // Check if already scheduled
    if (this.pendingVotes.has(voteKey)) {
      logger.warning(`Vote already scheduled for @${author}/${permlink} (${listType})`);
      return;
    }
    
    // Check daily vote limit
    const dailyCount = this.dbService.getDailyVoteCount(author, listType);
    if (dailyCount >= listEntry.max_votes_per_day) {
      logger.warning(`Daily vote limit reached for @${author} on ${listType} list (${dailyCount}/${listEntry.max_votes_per_day})`);
      return;
    }

    const voteTime = Date.now() + (listEntry.delay_minutes * 60 * 1000);
    
    this.pendingVotes.set(voteKey, {
      author,
      permlink,
      voteWeight: listEntry.vote_weight,
      listType,
      scheduledTime: voteTime
    });

    logger.success(`Scheduled ${listType} vote for @${author}/${permlink} in ${listEntry.delay_minutes} minutes (${listEntry.vote_weight}%)`);
  }

  // Process pending votes that are ready
  async processPendingVotes() {
    const now = Date.now();
    
    for (const [key, vote] of this.pendingVotes.entries()) {
      if (now >= vote.scheduledTime) {
        await this.executeVote(vote);
        this.pendingVotes.delete(key);
      }
    }
  }

  // Execute a vote with all accounts
  async executeVote(vote) {
    const { author, permlink, voteWeight, listType } = vote;
    const accounts = this.dbService.getAccounts().filter(acc => acc.active);

    logger.vote(`Executing ${listType} vote for @${author}/${permlink} with ${accounts.length} account(s)`);

    if (accounts.length === 0) {
      logger.warning('No active accounts available for voting!');
      return;
    }

    for (const account of accounts) {
      try {
        // Get account VP
        const vpInfo = await this.hiveService.getAccountVP(account.username);
        const currentVP = parseFloat(vpInfo.votingPower);

        // Check VP threshold
        if (currentVP < account.min_vp_threshold) {
          logger.warning(`Skipping vote: ${account.username} VP (${currentVP.toFixed(2)}%) below threshold (${account.min_vp_threshold}%)`);
          continue;
        }

        // Decrypt posting key
        const accountData = this.dbService.getAccountWithKey(account.username);
        const postingKey = this.encryptionService.decrypt(
          accountData.encrypted_key,
          accountData.iv,
          this.masterPassword
        );

        // Calculate vote weight (-10000 to 10000)
        const weight = listType === 'shit' 
          ? -Math.abs(voteWeight * 100) // Negative for downvote
          : Math.abs(voteWeight * 100);  // Positive for upvote

        // Cast vote
        await this.hiveService.vote(account.username, postingKey, author, permlink, weight);

        // Record vote
        this.dbService.addVoteHistory(account.username, author, permlink, weight, listType, true);
        this.dbService.incrementDailyVoteCount(author, listType);

        logger.success(`${account.username} voted on @${author}/${permlink} (${weight/100}%)`);
      } catch (error) {
        logger.error(`Vote failed for ${account.username}: ${error.message}`);
        this.dbService.addVoteHistory(account.username, author, permlink, voteWeight * 100, listType, false, error.message);
      }
    }
  }

  // Get last processed block from file
  getLastProcessedBlock() {
    try {
      if (fs.existsSync(this.lastBlockFile)) {
        const blockNum = fs.readFileSync(this.lastBlockFile, 'utf8').trim();
        return parseInt(blockNum) || null;
      }
    } catch (error) {
      console.error('Error reading lastblock.txt:', error);
    }
    return null;
  }

  // Save last processed block to file
  saveLastProcessedBlock(blockNum) {
    try {
      fs.writeFileSync(this.lastBlockFile, blockNum.toString());
    } catch (error) {
      console.error('Error writing lastblock.txt:', error);
    }
  }

  // Get bot status
  getStatus() {
    return {
      isRunning: this.isRunning,
      pendingVotes: this.pendingVotes.size,
      lastBlock: this.getLastProcessedBlock()
    };
  }
}

module.exports = VotingService;
