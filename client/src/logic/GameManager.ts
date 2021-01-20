import { EventEmitter } from "events"
import ConnectionHandler from "./ConnectionHandler";
import ILightPlayer from "../../../common/ILightPlayer";
import { IMapFile, ITask } from "../../../common/IMapFile";

export enum GameState {
    Gameplay,
    Meeting
}

export class GameManager {
    private em = new EventEmitter();
    readonly connectionHandler: ConnectionHandler;

    players: ILightPlayer[] = [];
    gameConfig: any = {};
    mapInfo: IMapFile = {
        mapImage: '',
        tasks: []
    };

    /**
     * All of this player's tasks
     * {taskID, isDone?}
     */
    tasks: Record<string, boolean> = {};

    taskBar = 0;

    constructor(connectionHandler: ConnectionHandler) {
        this.connectionHandler = connectionHandler;
        this.initializeSocket()
    }
    
    /**
     * The name of the local player.
     */
    get localPlayerName() {
        return this.connectionHandler.connectionInfo.playerName;
    }

    /**
     * The light player object representing the local player.
     * For efficiency, use `localPlayerName` if you only need the name.
     */
    get localPlayer() {
        const name = this.localPlayerName;
        for (let player of this.players) {
            if (player.name === name) return player;
        }
        throw "Local player name as defined in connection is not present in player list. This is probably the server's fault."
    }

    getTask(taskID: string) {
        return this.mapInfo.tasks.find(task => task.id === taskID);
    }

    getTaskSafe(taskID: string): ITask {
        const task = this.getTask(taskID);
        if (task === undefined) throw `No task of ID ${taskID}`;
        return task;
    }

    /**
     * Request that the server assign the client a task.
     * @param taskID Task ID
     */
    requestTask(taskID: string) {
        console.log(`Requesting task ${taskID}...`);
        this.connectionHandler.io.emit('requestTask', taskID);
    }

    /**
     * Tell the server that a task is finished.
     * @param taskID Task ID?
     * @param aborted Was the task aborted?
     */
    finishTask(taskID: string, aborted: boolean) {
        this.connectionHandler.io.emit('taskFinished', {'aborted': aborted});
    }

    /**
     * Let the server know that a task has been confirmed complete, or QR-code verified.
     * @param canceled Whether QR-code verification failed.
     */
    completeTask(canceled: boolean) {
        this.connectionHandler.io.emit('taskComplete', {'canceled': canceled})
    }

    protected startGame = (data: {roster: ILightPlayer[], gameConfig: any, mapInfo: IMapFile}) => {
        console.log('Starting game...')
        const { roster, gameConfig, mapInfo } = data;
        this.players = roster;
        this.gameConfig = gameConfig;
        this.mapInfo = mapInfo;
        this.em.emit('startGame');
    }

    protected doTask = (id: string, callback: (params: {started: boolean}) => void) => {
        // locate task
        const task = this.getTask(id);
        if (task === undefined) {
            console.error(`The server has requested client to do task ${id}, but it is not in the map file.`);
            callback({started: false});
            return;
        }
        this.em.emit('doTask', task)
        callback({started: true});
    }

    protected updateTasks = (tasks: Record<string, boolean>) => {
        this.tasks = tasks;
        this.em.emit('updateTasks', this.tasks);
    }

    protected updateTaskBar = (value: number) => {
        this.taskBar = value;
        this.em.emit('updateTaskBar', value);
    }

    protected initializeSocket() {
        this.connectionHandler.io.on('startGame', this.startGame);
        this.connectionHandler.io.on('updateTasks', this.updateTasks);
        this.connectionHandler.io.on('doTask', this.doTask);
        this.connectionHandler.io.on('updateTaskBar', this.updateTaskBar);
    }

    // EVENTS
    /**
     * Called when the game starts.
     * @param listener Event listener.
     */
    onGameStart(listener: () => void) {
        this.em.on('startGame', listener);
    }

    /**
     * Called when the client is to do a task.
     * @param listener Event listener.
     */
    onDoTask(listener: (task: ITask) => void) {
        this.em.on('doTask', listener);
    }

    /**
     * Called when the client receives an update to it's task list from the server.
     * @param listener Event listener. (key: taskID, value: isDone)
     */
    onUpdateTasks(listener: (tasks: Record<string, boolean>) => void) {
        this.em.on('updateTasks', listener);
    }

    /**
     * Called when the client recieves an update to the value in the task bar.
     * @param listener Event listener.
     */
    onUpdateTaskBar(listener: (value: number) => void) {
        this.em.on('updateTaskBar', listener);
    }
}