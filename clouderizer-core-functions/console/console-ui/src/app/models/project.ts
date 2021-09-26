

export declare interface Project {
    name: string;
    machinetype: string;
    showcase_model: string;
    showcaseflaskon: boolean,
    jupyteron: boolean;
    tboardon: boolean;
    h2oon: boolean;
    daion: boolean;
    modelserveon: boolean;
    terminalon: boolean;
    customserveron: boolean;
    customserverport_s: number;
    
    ami_index: string; //  
    ami: string; //  
    region: string; //  
    azone: string;
    volumesize: number;
    requestspot: boolean;
    instype: string; //  
    bidprice: number; //
    ondemandprice: string; //

    //New workspace settings
    data_option: string;
    datadir: string;
    data_url: string;
    data_url_list: any[];
    data_url_uname: string;
    data_url_pwd: string;
    data_drive_path: string;

    code_option: string;  
    codedir: string;
    code_url: string;
    code_url_uname: string;
    code_url_pwd: string;
    code_drive_path: string;

    outputdir: string;
    output_keephistory: boolean;

    //*****OLD FIELDS *******/
    codeupload: boolean;
    dataupload: boolean;
    giturl: string; //  
    gituname: string; //  
    gitpwd: string; //
    //*****OLD FIELDS *******/
    
    startupcmd: string;
    setupcmd: string;
    autoterminate: boolean; 
    status: string;
    status_message: string;
    total_hours: number;
    total_storage: number;
    terminalurl: string;
    terminaluser: string;
    jupyterurl: string;
    tboardurl: string;
    h2ourl: string;
    daiurl: string;
    customserverurl: string;
    aptItems: any[];
    pipItems: any[];
    python: string;
    condaItems: any[];
    kaggleItems: any[];
    sharedUsers?: any;
    anaconda: boolean;
    cuda: boolean;
    torch: boolean;
    torchItems: any[];
    style?: string;
    id?: string;
    key: string;
    gdrive_colab_file_id: string;
    template: string;

    //*****NEW FIELDS *******/
    gpu_type: string;
    ram_size: number;
    no_of_gpu: number;
    no_of_cores: number;

    author_company: string;
    gcr_image_path: string;
    gcp_snapshot_name: string;
    firstrun: boolean;
    custom_docker_image: string;
}