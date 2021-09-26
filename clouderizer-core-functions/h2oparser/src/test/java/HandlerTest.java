import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Test;
import static org.junit.Assert.*;

import com.openfaas.function.Handler;
import com.openfaas.model.IHandler;
import com.openfaas.model.IRequest;
import com.openfaas.model.IResponse;
import com.openfaas.model.Request;

public class HandlerTest {
    @Test public void handlerIsNotNull() {
        IHandler handler = new Handler();
        assertTrue("Expected handler not to be null", handler != null);
    }

    @Test
    public void invalidURL() {
        IHandler handler = new Handler();
        JSONObject req_json = new JSONObject();
        try {
            req_json.put("url", "http://asdfasfd");
            // req_json.put("modeltype", "pmml");
        } catch (JSONException e) {
            e.printStackTrace();
        }
        IRequest req =  new Request(req_json.toString(), null);
        
        IResponse res = handler.Handle(req);
        assertTrue("Expected status code to be 500", res.getStatusCode() == 500);
        assertTrue("Expected response message", res.getBody().contains("Unable to download model file."));
        
    }

    @Test
    public void validURL() {
        IHandler handler = new Handler();
        JSONObject req_json = new JSONObject();
        try {
            req_json.put("url", "https://clouderizer-serving-projects.s3.us-east-2.amazonaws.com/deeplearning_model_fd884dda-a508-4c79-bebf-c19676722605.zip");
            // req_json.put("url", "https://clouderizer-serving-projects.s3.us-east-2.amazonaws.com/model_294b70a8-a971-43df-bf90-dd31083ce4e5.zip");
            // req_json.put("url", "https://clouderizer-serving-projects.s3.us-east-2.amazonaws.com/auto_test_75107113-8865-4972-9e01-96b88b181d03.zip");
            // req_json.put("modeltype", "h2o.ai");
        } catch (JSONException e) {
            e.printStackTrace();
        }
        IRequest req =  new Request(req_json.toString(), null);
        IResponse res = handler.Handle(req);
        System.out.println(res.getStatusCode());
        assertTrue("Expected status code to be 200", res.getStatusCode() == 200);
        assertTrue("Expected response message", res.getBody().contains("platform")); 
    }

    @Test
    public void validURL1() {
        IHandler handler = new Handler();
        JSONObject req_json = new JSONObject();
        try {
            // req_json.put("url", "https://clouderizer-serving-projects.s3.us-east-2.amazonaws.com/deeplearning_model_fd884dda-a508-4c79-bebf-c19676722605.zip");
            req_json.put("url", "https://clouderizer-serving-projects.s3.us-east-2.amazonaws.com/model_294b70a8-a971-43df-bf90-dd31083ce4e5.zip");
            // req_json.put("url", "https://clouderizer-serving-projects.s3.us-east-2.amazonaws.com/auto_test_75107113-8865-4972-9e01-96b88b181d03.zip");
            // req_json.put("modeltype", "h2o.ai");
        } catch (JSONException e) {
            e.printStackTrace();
        }
        IRequest req =  new Request(req_json.toString(), null);
        IResponse res = handler.Handle(req);
        System.out.println(res.getStatusCode());
        assertTrue("Expected status code to be 200", res.getStatusCode() == 200);
        assertTrue("Expected response message", res.getBody().contains("platform")); 
    }

    // @Test
    // public void validURL2() {
    //     IHandler handler = new Handler();
    //     JSONObject req_json = new JSONObject();
    //     try {
    //         // req_json.put("url", "https://clouderizer-serving-projects.s3.us-east-2.amazonaws.com/deeplearning_model_fd884dda-a508-4c79-bebf-c19676722605.zip");
    //         // req_json.put("url", "https://clouderizer-serving-projects.s3.us-east-2.amazonaws.com/model_294b70a8-a971-43df-bf90-dd31083ce4e5.zip");
    //         req_json.put("url", "https://clouderizer-serving-projects.s3.us-east-2.amazonaws.com/auto_test_75107113-8865-4972-9e01-96b88b181d03.zip");
    //         // req_json.put("modeltype", "h2o.ai");
    //     } catch (JSONException e) {
    //         e.printStackTrace();
    //     }
    //     IRequest req =  new Request(req_json.toString(), null);
    //     IResponse res = handler.Handle(req);
    //     System.out.println(res.getStatusCode());
    //     assertTrue("Expected status code to be 200", res.getStatusCode() == 200);
    //     assertTrue("Expected response message", res.getBody().contains("platform")); 
    // }

    @Test
    public void noURL() {
        IHandler handler = new Handler();
        JSONObject req_json = new JSONObject();
        // try {
        //     req_json.put("url", "http://");
        // } catch (JSONException e) {
        //     e.printStackTrace();
        // }
        IRequest req =  new Request(req_json.toString(), null);
        
        IResponse res = handler.Handle(req);
        assertTrue("Expected status code to be 500", res.getStatusCode() == 500);
        assertTrue("Expected response message", res.getBody().contains("An internal server error has occured."));
    }

}
