"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.textCleaner = exports.similarity = exports.htmlGenerator = exports.dataCleaner = exports.httpLogStream = exports.logger = void 0;
var logger_1 = require("./logger");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return __importDefault(logger_1).default; } });
Object.defineProperty(exports, "httpLogStream", { enumerable: true, get: function () { return logger_1.httpLogStream; } });
var data_cleaner_1 = require("./data-cleaner");
Object.defineProperty(exports, "dataCleaner", { enumerable: true, get: function () { return __importDefault(data_cleaner_1).default; } });
var html_generator_1 = require("./html-generator");
Object.defineProperty(exports, "htmlGenerator", { enumerable: true, get: function () { return __importDefault(html_generator_1).default; } });
var similarity_1 = require("./similarity");
Object.defineProperty(exports, "similarity", { enumerable: true, get: function () { return __importDefault(similarity_1).default; } });
var text_cleaner_1 = require("./text-cleaner");
Object.defineProperty(exports, "textCleaner", { enumerable: true, get: function () { return __importDefault(text_cleaner_1).default; } });
__exportStar(require("./data-cleaner"), exports);
__exportStar(require("./html-generator"), exports);
__exportStar(require("./similarity"), exports);
__exportStar(require("./text-cleaner"), exports);
//# sourceMappingURL=index.js.map