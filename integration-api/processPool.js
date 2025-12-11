// processPool.js - Manages 3 R service instances (ES Module version)
class ProcessPool {
  constructor() {
    this.processes = [
      { port: 8000, status: 'available', currentJob: null, service: 'r-ols' },
      { port: 8002, status: 'available', currentJob: null, service: 'r-logistic' },
      { port: 8004, status: 'available', currentJob: null, service: 'r-reserved' }
    ];
  }

  getAvailableProcess() {
    return this.processes.find(p => p.status === 'available');
  }

  markBusy(port, jobId) {
    const process = this.processes.find(p => p.port === port);
    if (process) {
      process.status = 'busy';
      process.currentJob = jobId;
      console.log(`✓ Process on port ${port} marked as BUSY (Job: ${jobId})`);
    }
  }

  markAvailable(port) {
    const process = this.processes.find(p => p.port === port);
    if (process) {
      const previousJob = process.currentJob;
      process.status = 'available';
      process.currentJob = null;
      console.log(`✓ Process on port ${port} marked as AVAILABLE (Completed: ${previousJob})`);
    }
  }

  getStatus() {
    const available = this.processes.filter(p => p.status === 'available').length;
    const busy = this.processes.filter(p => p.status === 'busy').length;
    
    return {
      total: this.processes.length,
      available,
      busy,
      utilization: `${((busy / this.processes.length) * 100).toFixed(1)}%`,
      processes: this.processes
    };
  }
}

// Export singleton instance
const processPool = new ProcessPool();
export default processPool;