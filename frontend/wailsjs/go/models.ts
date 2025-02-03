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

}

