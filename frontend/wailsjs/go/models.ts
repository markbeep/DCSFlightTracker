export namespace main {
	
	export class SelectedFiles {
	    Files: string[];
	    ReaderIndex: number;
	    Error: string;
	
	    static createFrom(source: any = {}) {
	        return new SelectedFiles(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Files = source["Files"];
	        this.ReaderIndex = source["ReaderIndex"];
	        this.Error = source["Error"];
	    }
	}

}

export namespace reader {
	
	export class Mission {
	    Name: string;
	    Seconds: number;
	
	    static createFrom(source: any = {}) {
	        return new Mission(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Seconds = source["Seconds"];
	    }
	}
	export class Aircraft {
	    Name: string;
	    TotalSeconds: number;
	    GroundSeconds: number;
	    Flights: number;
	    Missions: Mission[];
	
	    static createFrom(source: any = {}) {
	        return new Aircraft(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.TotalSeconds = source["TotalSeconds"];
	        this.GroundSeconds = source["GroundSeconds"];
	        this.Flights = source["Flights"];
	        this.Missions = this.convertValues(source["Missions"], Mission);
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
	    Failures: string[];
	
	    static createFrom(source: any = {}) {
	        return new TimesResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Aircrafts = this.convertValues(source["Aircrafts"], Aircraft);
	        this.Failures = source["Failures"];
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

