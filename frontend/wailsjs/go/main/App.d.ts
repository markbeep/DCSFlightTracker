// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
import {reader} from '../models';
import {main} from '../models';

export function GetProgress(arg1:number):Promise<reader.Progress>;

export function OpenDirectoryBrowser(arg1:number):Promise<main.SelectedFiles>;

export function ReadAnalysis(arg1:number):Promise<reader.TimesResult>;

export function StartAnalysing(arg1:number,arg2:Array<string>):Promise<void>;
