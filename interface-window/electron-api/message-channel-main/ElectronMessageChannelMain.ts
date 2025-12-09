
import {
    MessageChannelMain
} from 'electron';
import { IMessageChannelMain, IMessageChannelMainFactory } from './IMessageChannelMain';
import { IMessagePortMain } from '../message-port-main/IMessagePortMain';
import { ElectronMessagePortMain } from '../message-port-main/ElectronMessagePortMain';

export class ElectronMessageChannelMain implements IMessageChannelMain {
    private nativeChannel: MessageChannelMain;

    constructor() {
        this.nativeChannel = new MessageChannelMain();
    }

    get port1(): IMessagePortMain { return new ElectronMessagePortMain(this.nativeChannel.port1); }
    get port2(): IMessagePortMain { return new ElectronMessagePortMain(this.nativeChannel.port2); }
}

export class ElectronMessageChannelMainFactory implements IMessageChannelMainFactory {
    create(): IMessageChannelMain {
        return new ElectronMessageChannelMain();
    }
}
