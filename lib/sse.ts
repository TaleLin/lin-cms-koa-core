import { Transform, Readable, TransformCallback } from "stream";

export class SSE extends Transform {
  constructor(opts?: any) {
    super(opts);
  }

  _transform(chunk: any, encoding: string, cb: TransformCallback) {
    this.push(chunk.toString("utf8"));
    // this.push("data: " + chunk.toString("utf8") + "\n\n");
    cb();
  }
}

export class MessageBroker {
  public messages: string[] = [];
  private retry: number | undefined;
  private buffer: string[];
  private defaultId: number;
  constructor(defaultRetry = 2000) {
    this.buffer = [];
    this.defaultId = 1;
    this.setRetry(defaultRetry);
  }

  setRetry(num: number) {
    this.retry = num;
    this.buffer.push(`retry: ${this.retry}\n`);
  }

  setEventId(eventId?: number) {
    if (eventId) {
      this.defaultId = eventId;
      this.buffer.push(`id: ${eventId}\n`);
    } else {
      this.buffer.push(`id: ${this.defaultId}\n`);
    }
  }

  resetEventId() {
    this.setEventId(1);
  }

  increaseId() {
    this.defaultId += 1;
  }

  addMessage(event: string, obj: any, flush = true) {
    this.setEventId();
    this.buffer.push(`event: ${event}\n`);
    const line = JSON.stringify(obj);
    this.buffer.push(`data: ${line}\n\n`);
    flush && this.flushBuffer();
  }

  flushBuffer() {
    this.messages.push(this.joinBuffer());
    this.buffer.length = 0;
    this.increaseId();
  }

  joinBuffer() {
    return this.buffer.join("");
  }

  pop() {
    // return this.messages.pop();
    // 先进先出
    const tmp = this.messages[0];
    this.messages.splice(0, 1);
    return tmp;
  }

  heartbeat(comment?: string) {
    // 发送注释 : this is a test stream\n\n 告诉客户端，服务器还活着
    if (comment) {
      this.buffer.push(comment);
    } else {
      this.buffer.push(": sse sever is still alive \n\n");
      const tmp = this.joinBuffer();
      this.buffer.length = 0;
      return tmp;
    }
  }

  exitMessage() {
    return this.messages.length > 0;
  }
}

export class Subscription extends Readable {
  public value: number;
  constructor(opts?: any) {
    super(opts);
    this.value = 0;
  }

  _read() {
    // tslint:disable-next-line: no-empty
    while (this.push(String(this.value++))) {}
  }
}
