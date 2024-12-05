package com.rstobar.rest_bar_webapp;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;	

public class Handler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent>{

	
	private static String secret;
	static {
        try {
            String secretName = "rdsCredentials";
            Region region = Region.of("us-east-1");
            SecretsManagerClient client = SecretsManagerClient.builder().region(region).build();
            GetSecretValueRequest request = GetSecretValueRequest.builder().secretId(secretName).build();
            GetSecretValueResponse response = client.getSecretValue(request);
            secret = response.secretString(); // Cache the secret
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
	
	@Override
	public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
		
	    context.getLogger().log("Secret test:"+secret);
	    
		String path = event.getPath();
		context.getLogger().log("Recieved request for the path:"+path);
		APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
		response.setStatusCode(200);
		response.setBody("Hello from endpoint");
		return response;
	}

}
