/* eslint-disable no-console */

import async from "async";
import * as neo from "neo-api";

import findBestNode from "../helpers/findBestNode";
import getNextIndex from "../helpers/getNextIndex";

const VERBOSE = 1;
const PRIORITY_DEFAULT = 5;
// const PRIORITY_IMMEDIATE = 0;

export default class FetchQueue {
  constructor(callback, { concurrency = 1, pollInterval = 1000, queueSize = 1000 } = {}) {
    this.callback = callback;
    this.client = null;
    this.paused = false;
    this.pollInterval = pollInterval;
    this.queueSize = queueSize;
    this.queue = async.priorityQueue(this._process, concurrency);
    this.queue.drain = async () => { await this._poll(); };
  }

  start = async () => {
    if (!this.client) {
      this.client = await this._createClient();
    }

    if (this.paused) {
      this.paused = false;
      this.queue.resume();
    }

    await this._poll();
  }

  stop = () => {
    this.paused = true;
    this.queue.pause();

    if (this.clock) {
      clearInterval(this.clock);
      delete this.clock;
    }
  }

  _createClient = async () => {
    const node = await findBestNode();
    return neo.node(node.url);
  }

  _poll = async () => {
    await this._compareBlockHeight();  // TODO: drop the _ensureWorkingClient function and retry here
    if (this.queue.length() > 0) return;

    this.clock = setTimeout(this._poll, this.pollInterval);
  }

  _compareBlockHeight = async () => {
    const height = await this._getBlockCount();
    const nextIndex = await getNextIndex();
    const maxIndex = nextIndex + Math.min(height - nextIndex, this.queueSize) - 1;

    if (nextIndex > maxIndex) {
      console.log("Waiting for new blocks...");
    } else {
      console.log(`Enqueueing fetches for blocks ${nextIndex} to ${maxIndex}...`);

      for (let index = nextIndex; index <= maxIndex; index++) {
        this._enqueue(index);
      }

      console.log("Enqueued.");
    }
  }

  _enqueue = (index, priority = PRIORITY_DEFAULT) => {
    this.queue.push(index, priority, this.callback);
  }

  // _retry = async (index) => {
  //   this._enqueue(index, PRIORITY_IMMEDIATE);
  // }

  _process = async (index, callback) => {
    console.log(`Fetching block #${index}...`);

    // TODO: wrap this in a try/catch and retry by enqueueing
    callback(await this._getBlockByHeight(index));
  }

  _getBlockCount = async () => {
    return this._ensureWorkingClient(() => this.client.getBlockCount());
  }

  _getBlockByHeight = async (index) => {
    return this._ensureWorkingClient(() => this.client.getBlockByHeight(index, VERBOSE));
  }

  _ensureWorkingClient = async (callback) => {
    try {
      return callback();
    } catch (err) {
      this.client = await this._createClient();
      return this._ensureWorkingClient(callback);
    }
  }
}
