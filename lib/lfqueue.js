const { Atomics, SharedArrayBuffer } = require('node:buffer');

// lock-free access to communicate w/ worker threads
// keep disabled for now becasue shared memory in node is unsafe currently
class LFQueue {
    constructor(capacity) {
	this.capacity = capacity;
	this.sab = new SharedArrayBuffer((capacity + 2) * 4); // add +2 for head and tail
	this.head = new Int32Array(this.sab, 0, 1);
	this.tail = new Int32Array(this.sab, 4, 1);
	this.buffer = new Int32Array(this.sab, 8, capacity);
    }
    
    enqueue(value) {
	const tail = Atomics.load(this.tail, 0);
	if ((tail + 1) % this.capacity === Atomics.load(this.head, 0)) { // full
	    return false;
	}
	this.buffer[tail] = value;
	Atomics.store(this.tail, 0, (tail + 1) % this.capacity);
	return true;
    }
    
    dequeue() {
	const head = Atomics.load(this.head, 0);
	if (head === Atomics.load(this.tail, 0)) { // empty
	    return null; 
	}
	const value = this.buffer[head];
	Atomics.store(this.head, 0, (head + 1) % this.capacity);
	return value;
    }
}
module.exports = LFQueue;
