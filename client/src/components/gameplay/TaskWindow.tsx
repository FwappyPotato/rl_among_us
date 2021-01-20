import React, { Component } from 'react'
import Task from './tasks/Task'
import { GameManager } from '../../logic/GameManager';
import { ITask } from '../../../../common/IMapFile';
import BasicTask from './tasks/BasicTask';
import DownloadTask from './tasks/DownloadTask';
import SimonSays from './tasks/SimonSays';

interface IProps {
    gameManager: GameManager;
    task: ITask;
    onFinish?: (aborted: boolean) => void;
}

export class TaskWindow extends Component<IProps> {
    manifest: any;

    // UPDATE THIS METHOD WITH NEW TASKS
    getTask(classID: string) {
        const { gameManager, task } = this.props;
        if (classID === 'basic') return <BasicTask gameManager={gameManager} task={task} onFinish={this.onFinish}/>
        if (classID == 'download') return <DownloadTask gameManager={gameManager} task={task} onFinish={this.onFinish}/>
        if (classID === 'simonSays') return <SimonSays gameManager={gameManager} task={task} onFinish={this.onFinish}/>
    }

    onFinish = () => {
        if (this.props.onFinish) this.props.onFinish(false);
    }

    handleCloseButton = () => {
        if (this.props.onFinish) this.props.onFinish(true);
    }

    render() {
        return (
            <div style={{display: 'inline-block'}}>
                <div className='TaskDiv'>{this.getTask(this.props.task.classID)}</div>
                <button className='CloseButton' onClick={this.handleCloseButton}>X</button>
            </div>
        )
    }
    
}

export default TaskWindow
