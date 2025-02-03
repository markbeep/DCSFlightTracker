export namespace main {
	
	export class SelectedDirectory {
	    DirPath: string;
	    Files: string[];
	    ReaderIndex: number;
	    Error: string;
	
	    static createFrom(source: any = {}) {
	        return new SelectedDirectory(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.DirPath = source["DirPath"];
	        this.Files = source["Files"];
	        this.ReaderIndex = source["ReaderIndex"];
	        this.Error = source["Error"];
	    }
	}

}

export namespace reader {
	
	export class Aircraft {
	    Name: string;
	    Seconds: number;
	
	    static createFrom(source: any = {}) {
	        return new Aircraft(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Seconds = source["Seconds"];
	    }
	}
	export class Progress {
	    Successful: number;
	    Failed: number;
	    Total: number;
	
	    static createFrom(source: any = {}) {
	        return new Progress(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Successful = source["Successful"];
	        this.Failed = source["Failed"];
	        this.Total = source["Total"];
	    }
	}
	export class TimesResult {
	    Aircrafts: Aircraft[];
	    Fails: string[];
	
	    static createFrom(source: any = {}) {
	        return new TimesResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Aircrafts = this.convertValues(source["Aircrafts"], Aircraft);
	        this.Fails = source["Fails"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

