const dhive = require('@hiveio/dhive');

class HiveService {
  constructor() {
    this.client = new dhive.Client([
      'https://api.hive.blog',
      'https://api.deathwing.me',
      'https://hived.emre.sh'
    ]);
  }

  // Calculate current voting power (upvote)
  calculateVotingPower(account) {
    const lastVoteTime = new Date(account.last_vote_time + 'Z').getTime();
    const now = Date.now();
    const elapsed = now - lastVoteTime;
    
    // VP regenerates at 20% per day = 0.0002314815% per second
    const regenRate = 0.0002314815;
    const vpRegen = (elapsed / 1000) * regenRate;
    
    const currentVP = Math.min(10000, account.voting_power + vpRegen);
    return currentVP / 100; // Return as percentage (0-100)
  }

  // Calculate downvote mana (separate from upvote VP)
  async calculateDownvoteVP(account) {
    try {
      // Get global properties for regen time
      const gprops = await this.client.database.getDynamicGlobalProperties();
      
      const downvoteManabar = account.downvote_manabar;
      const regenSeconds = gprops.downvote_regen_seconds || 432000; // 5 days default
      
      // Max mana based on vesting shares
      const vestingShares = parseFloat(account.vesting_shares.split(' ')[0]);
      const maxMana = vestingShares * 1e6;
      
      const currentMana = parseInt(downvoteManabar.current_mana);
      const lastUpdate = downvoteManabar.last_update_time;
      
      const now = Math.floor(Date.now() / 1000);
      
      // Calculate regenerated mana
      const regenerated = ((now - lastUpdate) * maxMana) / regenSeconds;
      const finalMana = Math.min(currentMana + regenerated, maxMana);
      
      // VP in percent (0-100)
      const downvoteVP = (finalMana / maxMana) * 100;
      
      return downvoteVP;
    } catch (error) {
      console.error('Error calculating downvote VP:', error);
      return 0;
    }
  }

  // Get account info and VP (both upvote and downvote)
  async getAccountVP(username) {
    try {
      const [account] = await this.client.database.getAccounts([username]);
      if (!account) throw new Error('Account not found');
      
      const upvoteVP = this.calculateVotingPower(account);
      const downvoteVP = await this.calculateDownvoteVP(account);
      
      return {
        username: account.name,
        votingPower: upvoteVP.toFixed(2),      // Upvote VP
        downvotePower: downvoteVP.toFixed(2),  // Downvote VP
        lastVoteTime: account.last_vote_time
      };
    } catch (error) {
      throw new Error(`Failed to get VP for ${username}: ${error.message}`);
    }
  }

  // Cast a vote
  async vote(username, postingKey, author, permlink, weight) {
    try {
      const privateKey = dhive.PrivateKey.fromString(postingKey);
      
      const voteOp = [
        'vote',
        {
          voter: username,
          author: author,
          permlink: permlink,
          weight: weight // -10000 to 10000
        }
      ];

      const result = await this.client.broadcast.sendOperations([voteOp], privateKey);
      return { success: true, result };
    } catch (error) {
      throw new Error(`Vote failed: ${error.message}`);
    }
  }

  // Stream blockchain blocks
  async streamBlocks(startBlock, callback) {
    try {
      const stream = this.client.blockchain.getBlockStream({ from: startBlock });
      
      for await (const block of stream) {
        await callback(block);
      }
    } catch (error) {
      throw new Error(`Block streaming error: ${error.message}`);
    }
  }

  // Get current block number
  async getCurrentBlockNumber() {
    const props = await this.client.database.getDynamicGlobalProperties();
    return props.head_block_number;
  }

  // Process block for post/comment operations
  processBlockOperations(block) {
    const operations = [];
    
    block.transactions.forEach((tx) => {
      tx.operations.forEach((op) => {
        const [opType, opData] = op;
        
        // Only track comment operations (posts and comments)
        if (opType === 'comment') {
          operations.push({
            type: 'comment',
            author: opData.author,
            permlink: opData.permlink,
            parentAuthor: opData.parent_author,
            isPost: opData.parent_author === '' // Post if no parent
          });
        }
      });
    });
    
    return operations;
  }
}

module.exports = HiveService;
