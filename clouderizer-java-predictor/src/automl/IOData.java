package automl;

import java.util.List;

public class IOData {

	private String name;
	
//	private String displayName;
	
	private String dataType;
	
	private String opType;// set this to specific types scalable to different models
	
	private List<?> domains;
 
	public List<?> getDomains() {
		return domains;
	}

	public void setDomains(List<?> discreteDomains) {
		this.domains = discreteDomains;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

//	public String getDisplayName() {
//		return displayName;
//	}
//
//	public void setDisplayName(String displayName) {
//		this.displayName = displayName;
//	}

	public String getDataType() {
		return dataType;
	}

	public void setDataType(String dataType) {
		this.dataType = dataType;
	}

	public String getOpType() {
		return opType;
	}

	public void setOpType(String opType) {
		this.opType = opType;
	}

//	public void setDomains(List<?> validInputValues) {
//		// TODO Auto-generated method stub
//		
//	}
}
