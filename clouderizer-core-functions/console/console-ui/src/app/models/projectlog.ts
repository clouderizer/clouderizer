import { Project } from "./project";



export declare interface ProjectLog {
  session_id: string;
  awsinstanceid: string;
  state: string;
  starttime: Date;
  endtime: Date;
  pingtime: Date;
  project: Project;
}