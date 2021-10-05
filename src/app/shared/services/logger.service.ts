import { Injectable } from '@angular/core';

const logLevel = Object.freeze({
  INFO: 0,
  WARN: 1,
  ERROR: 2
});

/**
 * @description
 *   This service is used to handle the logs strongly
 * Means you can connected with apis and other service.
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  constructor() {
  }

  info(...message) {
    this.log(logLevel.INFO, message);
  }

  warn(...message) {
    this.log(logLevel.WARN, message);
  }

  error(from, message) {
    this.log(logLevel.ERROR, from, message);
  }

  private log(level, ...arg) {
    switch (level) {
      case logLevel.INFO:
        console.log(arg);
        break;
      case logLevel.WARN:
        console.warn(arg);
        break;
      case logLevel.ERROR:
        console.error('ERROR INITIATED FROM:', arg?.[0]);
        console.error('ERROR', arg?.[1]);
        break;
    }
  }

}
