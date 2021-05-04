package org.dainst.idaifield.datastore;

import org.apache.http.HttpHeaders;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.dainst.idaifield.ErrorMessage;
import org.dainst.idaifield.model.Geometry;
import org.dainst.idaifield.model.GeometryType;
import org.dainst.idaifield.model.Resource;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Base64;


/**
 * @author Thomas Kleinke
 */
public class Datastore {

    public static Map<GeometryType, List<Resource>> getResourcesWithGeometry(String projectName, String password,
                                                                             String operationId) throws Exception {

        String query = "{ \"selector\": { \"resource.geometry\": { \"$gt\": null }";

        if (!operationId.equals("project")) {
            query += ", \"$or\": [{ \"resource.id\": \"" + operationId + "\" }, "
                    + "{ \"resource.relations.isRecordedIn\": { \"$elemMatch\": " +
                    "{ \"$eq\": \"" + operationId + "\" } } }]";
        }

        query += " } }";

        try {
            return getResourcesMap(extractResources(getJsonData(projectName, password, query)));
        } catch (Exception e) {
            throw new Exception(ErrorMessage.DATASTORE_GET_RESOURCES_ERROR.name());
        }
    }


    private static JSONArray getJsonData(String projectName, String password, String query) throws Exception {

        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost httpPost = new HttpPost("http://localhost:3000/" + projectName + "/_find");
            httpPost.setHeader(HttpHeaders.CONTENT_TYPE, "application/json");
            httpPost.setHeader(HttpHeaders.ACCEPT, "application/json");

            String encoding = Base64.getEncoder().encodeToString((projectName + ":" + password).getBytes("UTF-8"));
            httpPost.setHeader(HttpHeaders.AUTHORIZATION, "Basic " + encoding);

            httpPost.setEntity(new StringEntity(query));

            try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
                JSONObject json = new JSONObject(EntityUtils.toString(response.getEntity(),
                        "UTF-8"));
                return json.getJSONArray("docs");
            }
        }
    }


    private static List<Resource> extractResources(JSONArray jsonData) throws Exception {

        List<Resource> resources = new ArrayList<>();

        for (int i = 0; i < jsonData.length(); i++) {
            JSONObject jsonResource = jsonData.getJSONObject(i).getJSONObject("resource");
            resources.add(createResource(jsonResource));
        }

        return resources;
    }


    private static Resource createResource(JSONObject jsonResource) throws Exception {

        Resource resource = new Resource();
        resource.setIdentifier(jsonResource.getString("identifier"));
        resource.setCategory(jsonResource.getString("type"));
        if (jsonResource.has("shortDescription")) {
            resource.setShortDescription(jsonResource.getString("shortDescription"));
        }


        JSONObject jsonGeometry = jsonResource.getJSONObject("geometry");
        resource.setGeometry(createGeometry(jsonGeometry));

        return resource;
    }


    private static Geometry createGeometry(JSONObject jsonGeometry) throws Exception {

        Geometry geometry = new Geometry();
        JSONArray jsonCoordinates = jsonGeometry.getJSONArray("coordinates");

        switch(jsonGeometry.getString("type")) {
            case "Point":
                geometry.setType(GeometryType.MULTIPOINT);
                geometry.setCoordinates(new double[][][][]{{{extractPointCoordinates(jsonCoordinates)}}});
                break;
            case "MultiPoint":
                geometry.setType(GeometryType.MULTIPOINT);
                geometry.setCoordinates(new double[][][][]{{extractMultiPointOrPolylineCoordinates(jsonCoordinates)}});
                break;
            case "LineString":
                geometry.setType(GeometryType.MULTIPOLYLINE);
                geometry.setCoordinates(new double[][][][]{{extractMultiPointOrPolylineCoordinates(jsonCoordinates)}});
                break;
            case "MultiLineString":
                geometry.setType(GeometryType.MULTIPOLYLINE);
                geometry.setCoordinates(new double[][][][]{extractMultiPolylineOrPolygonCoordinates(jsonCoordinates)});
                break;
            case "Polygon":
                geometry.setType(GeometryType.MULTIPOLYGON);
                geometry.setCoordinates(new double[][][][]{extractMultiPolylineOrPolygonCoordinates(jsonCoordinates)});
                break;
            case "MultiPolygon":
                geometry.setType(GeometryType.MULTIPOLYGON);
                geometry.setCoordinates(extractMultiPolygonCoordinates(jsonCoordinates));
                break;
            default:
                throw new Exception("Invalid geometry type: " + jsonGeometry.getString("type"));
        }

        return geometry;
    }


    private static double[] extractPointCoordinates(JSONArray jsonCoordinates) {

        double[] coordinates = new double[jsonCoordinates.length()];
        for (int i = 0; i < jsonCoordinates.length(); i++) {
            coordinates[i] = jsonCoordinates.getDouble(i);
        }

        return coordinates;
    }


    private static double[][] extractMultiPointOrPolylineCoordinates(JSONArray jsonCoordinates) {

        double[][] coordinates = new double[jsonCoordinates.length()][];
        for (int i = 0; i < jsonCoordinates.length(); i++) {
            coordinates[i] = extractPointCoordinates(jsonCoordinates.getJSONArray(i));
        }

        return coordinates;
    }


    private static double[][][] extractMultiPolylineOrPolygonCoordinates(JSONArray jsonCoordinates) {

        double[][][] coordinates = new double[jsonCoordinates.length()][][];

        for (int i = 0; i < jsonCoordinates.length(); i++) {
            coordinates[i] = extractMultiPointOrPolylineCoordinates(jsonCoordinates.getJSONArray(i));
        }

        return coordinates;
    }


    private static double[][][][] extractMultiPolygonCoordinates(JSONArray jsonCoordinates) {

        double [][][][] coordinates = new double[jsonCoordinates.length()][][][];

        for (int i = 0; i < jsonCoordinates.length(); i ++) {
            coordinates[i] = extractMultiPolylineOrPolygonCoordinates(jsonCoordinates.getJSONArray(i));
        }

        return coordinates;
    }


    private static Map<GeometryType, List<Resource>> getResourcesMap(List<Resource> resources) {

        Map<GeometryType, List<Resource>> resourcesMap = new HashMap<>();

        for (Resource resource : resources) {
            GeometryType geometryType = resource.getGeometry().getType();
            if (!resourcesMap.containsKey(geometryType)) {
                resourcesMap.put(geometryType, new ArrayList<>());
            }
            resourcesMap.get(geometryType).add(resource);
        }

        return resourcesMap;
    }
}
