"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
require("@twilio-labs/serverless-runtime-types");
var airtable_1 = __importDefault(require("airtable/lib/airtable"));
var handler = function (context, event, callback) { return __awaiter(void 0, void 0, void 0, function () {
    var base, message, phoneNumber, twiml, id, user, result, result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                base = new airtable_1.default({ apiKey: process.env.API_KEY }).base('appIYujosS9RbtTtl');
                message = event.Body.toLowerCase();
                phoneNumber = event.From || event.phoneNumber || '+14405273672';
                twiml = new Twilio.twiml.MessagingResponse();
                _a.label = 1;
            case 1:
                _a.trys.push([1, 11, , 12]);
                if (!(message === 'in' || message === 'out')) return [3 /*break*/, 9];
                return [4 /*yield*/, getCurrentPunch(base, phoneNumber)];
            case 2:
                id = _a.sent();
                return [4 /*yield*/, getCurrentUser(base, phoneNumber)];
            case 3:
                user = _a.sent();
                if (!(id && message === 'out')) return [3 /*break*/, 5];
                return [4 /*yield*/, updateCurrentPunch(base, id)];
            case 4:
                result = _a.sent();
                if (result) {
                    twiml.message("succesfully punched out");
                }
                return [3 /*break*/, 8];
            case 5:
                if (!(!id && message === 'in')) return [3 /*break*/, 7];
                return [4 /*yield*/, punchIn(base, phoneNumber, user)];
            case 6:
                result = _a.sent();
                if (result) {
                    twiml.message("succesfully punched in");
                }
                return [3 /*break*/, 8];
            case 7:
                twiml.message("You are already punched in!");
                _a.label = 8;
            case 8: return [3 /*break*/, 10];
            case 9:
                twiml.message("not sure what you wanted to do");
                _a.label = 10;
            case 10: return [2 /*return*/, callback(null, twiml)];
            case 11:
                error_1 = _a.sent();
                return [2 /*return*/, callback(error_1)];
            case 12: return [2 /*return*/];
        }
    });
}); };
exports.handler = handler;
function punchIn(base, phoneNumber, user) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, base('Timesheet').create([
                    {
                        "fields": {
                            "Phone Number": phoneNumber,
                            "Punch In": "in",
                            "User": user
                        }
                    }
                ]).then(function (record) {
                    return record[0].id;
                }).catch(function (err) {
                    throw Error("unable to create record");
                })];
        });
    });
}
function getCurrentPunch(base, phoneNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var found, id;
        return __generator(this, function (_a) {
            found = false;
            id = '';
            return [2 /*return*/, base('Timesheet').select({
                    view: 'Grid view',
                    filterByFormula: "AND(({Phone Number} = '".concat(phoneNumber, "'),({Punch Out} = ''))")
                }).firstPage().then(function (records) {
                    for (var _i = 0, records_1 = records; _i < records_1.length; _i++) {
                        var record = records_1[_i];
                        found = true;
                        id = record.id;
                    }
                    return id;
                }).catch(function (err) {
                    throw Error("unable to get record");
                }).finally(function () {
                    if (!found) {
                        return undefined;
                    }
                })];
        });
    });
}
function getCurrentUser(base, phoneNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var found, id;
        return __generator(this, function (_a) {
            found = false;
            id = '';
            return [2 /*return*/, base('Users').select({
                    view: 'Grid view',
                    filterByFormula: "({Phone Number} = '".concat(phoneNumber, "')")
                }).firstPage().then(function (records) {
                    for (var _i = 0, records_2 = records; _i < records_2.length; _i++) {
                        var record = records_2[_i];
                        found = true;
                        id = ensureString(record.get("Employee"));
                    }
                    return id;
                }).catch(function (err) {
                    throw Error("unable to get record");
                }).finally(function () {
                    if (!found) {
                        return '';
                    }
                })];
        });
    });
}
function updateCurrentPunch(base, id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, base('Timesheet').update(id, {
                    "Punch Out": "out"
                }).then(function (record) {
                    return record.id;
                }).catch(function (err) {
                    throw Error("unable to update record");
                })];
        });
    });
}
function ensureString(data) {
    if (typeof data == 'string') {
        return data;
    }
    else {
        return '';
    }
}
//# sourceMappingURL=timesheet.js.map