package org.dainst.idaifield.converter;

import org.dainst.idaifield.model.Geometry;
import org.dainst.idaifield.model.Resource;

import java.util.List;


/**
 * @author Thomas Kleinke
 */
class JsonlSerializer {

    static String getJsonl(List<Resource> resources) {

        StringBuilder jsonl = new StringBuilder();

        for (Resource resource : resources) {
            jsonl.append(getJsonlForResource(resource)).append("\n");
        }

        return jsonl.toString();
    }


    private static String getJsonlForResource(Resource resource) {

        StringBuilder jsonl = new StringBuilder("{");

        if (hasValue(resource.getIdentifier())) {
            jsonl.append(" \"identifier\": \"").append(resource.getIdentifier()).append("\",");
        }

        if (hasValue(resource.getShortDescription())) {
            jsonl.append(" \"shortDescription\": \"").append(resource.getShortDescription()).append("\",");
        }

        if (hasValue(resource.getCategory())) {
            jsonl.append(" \"category\": \"").append(resource.getCategory()).append("\",");
        }

        return jsonl.append(" \"geometry\": ")
                .append(getJsonlForGeometry(resource.getGeometry()))
                .append(" }")
                .toString();
    }


    private static String getJsonlForGeometry(Geometry geometry) {

        return "{ \"coordinates\": " + geometry.getGeojsonCoordinates()
                + ", \"type\": \"" + geometry.getGeojsonType() + "\" }";
    }


    private static boolean hasValue(String fieldContent) {

        return fieldContent != null && !fieldContent.equals("");
    }
}
