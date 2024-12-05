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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const path = __importStar(require("path"));
const artifactPath = path.join(__dirname, "artifacts", "movie-builder-assistant.xml");
const assistant = new index_1.Assistant({ "@ref": artifactPath });
describe("assistant", () => {
    it("loads name and description", () => {
        expect(assistant.name).toMatchSnapshot();
        expect(assistant.description).toMatchSnapshot();
    });
    it("loads xml", () => {
        expect(assistant).toMatchSnapshot();
    });
    it("loads workflows", () => {
        expect(assistant.workflows).toMatchSnapshot();
    });
    it("starts workflow", () => __awaiter(void 0, void 0, void 0, function* () {
        const workflowRunner = assistant.loadWorkflow("character-building");
        const mockResponses = {
            "Produce 2 surnames that sound good with the name: John": {
                surnames: ["Doe", "Smith"],
            },
            "Given the name: John select one of the surnames: Doe,Smith": {
                surname: "Doe",
            },
            "Generate a character with the name: John and the surname: Doe": {
                character: "John Doe",
            },
        };
        // mock workflow.generateResponse with jest based
        workflowRunner.generateResponse = jest
            .fn()
            .mockImplementation((prompt) => {
            console.log("prompt", prompt);
            return mockResponses[prompt];
        });
        workflowRunner.on("step-finished", (prompt, data) => {
            console.log("step finished", prompt, data);
            workflowRunner.next();
        });
        workflowRunner.on("workflow-finished", (workflow) => {
            console.log("workflow finished");
        });
        const workflow = workflowRunner.start({
            name: "John",
            surnamesLength: 2,
        });
        console.log("workflow", workflow);
        yield workflowRunner.onFinish();
        expect(workflowRunner.generateResponse).toHaveBeenCalledTimes(3);
        expect(workflowRunner.history).toMatchSnapshot();
    }));
});
