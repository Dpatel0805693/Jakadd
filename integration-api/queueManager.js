// queueManager.js - FIFO queue with max 10 requests (ES Module version)
class QueueManager {
  constructor() {
    this.queue = [];
    this.maxSize = 10;
  }

  enqueue(job) {
    if (this.queue.length >= this.maxSize) {
      throw new Error('Queue full');
    }
    this.queue.push({
      ...job,
      enqueuedAt: new Date().toISOString()
    });
    console.log(`✓ Job ${job.id} enqueued. Queue size: ${this.queue.length}/${this.maxSize}`);
    return this.queue.length;
  }

  dequeue() {
    const job = this.queue.shift();
    if (job) {
      console.log(`✓ Job ${job.id} dequeued. Remaining: ${this.queue.length}`);
    }
    return job;
  }

  getSize() {
    return this.queue.length;
  }

  clear() {
    const count = this.queue.length;
    this.queue = [];
    console.log(`✓ Queue cleared. Removed ${count} jobs.`);
    return count;
  }

  getStatus() {
    return {
      current: this.queue.length,
      max: this.maxSize,
      available: this.maxSize - this.queue.length,
      jobs: this.queue.map(j => ({ 
        id: j.id, 
        userId: j.userId,
        enqueuedAt: j.enqueuedAt 
      }))
    };
  }
}

// Export singleton instance
const queueManager = new QueueManager();
export default queueManager;