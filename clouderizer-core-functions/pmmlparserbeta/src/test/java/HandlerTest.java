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
        } catch (JSONException e) {
            e.printStackTrace();
        }
        IRequest req =  new Request(req_json.toString(), null);
        
        IResponse res = handler.Handle(req);
        assertTrue("Expected status code to be 500", res.getStatusCode() == 500);
        assertTrue("Expected response message", res.getBody().contains("Unable to download model file."));
        
    }

    // @Test
    // public void validURL() {
    //     IHandler handler = new Handler();
    //     JSONObject req_json = new JSONObject();
    //     try {
    //         req_json.put("url", "https://clouderizer-serving-projects.s3.us-east-2.amazonaws.com/BankMarketing_339fdb74-a45f-457c-b8c8-49372948c262.pmml");
    //     } catch (JSONException e) {
    //         e.printStackTrace();
    //     }
    //     IRequest req =  new Request(req_json.toString(), null);
        
    //     IResponse res = handler.Handle(req);
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
