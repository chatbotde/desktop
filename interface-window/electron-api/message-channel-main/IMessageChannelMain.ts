
import { IMessagePortMain } from '../message-port-main/IMessagePortMain';

export interface IMessageChannelMain {
    readonly port1: IMessagePortMain;
    readonly port2: IMessagePortMain;
}

export interface IMessageChannelMainFactory {
    create(): IMessageChannelMain;
}
