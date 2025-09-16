from qgis.core import QgsFeature, QgsGeometry, QgsPointXY, QgsVectorLayer, QgsProject
from qgis.gui import QgsMapToolEmitPoint
from qgis.PyQt.QtWidgets import QInputDialog
from math import cos, radians

# Function to convert feet to degrees, considering latitude for east-west conversion
def feet_to_degrees(feet, is_longitude, latitude=0):
    if is_longitude:
        # Adjust conversion factor based on latitude for longitude
        return feet / (364000 * cos(radians(latitude)))
    else:
        # Latitude conversion remains the same for north-south
        return feet / 364000

# Prompt for project latitude
project_latitude, ok_lat = QInputDialog.getDouble(None, "Project Latitude", "Enter the latitude of your project:", decimals=6)

# Set up the distances and number of zigzags
distance_north_south, ok_ns = QInputDialog.getDouble(None, "Input Distance", "Enter North-South distance (in feet):", 713, decimals=2)
distance_east_west, ok_ew = QInputDialog.getDouble(None, "Input Distance", "Enter East-West distance (in feet):", 44, decimals=2)
zigzags, ok_z = QInputDialog.getInt(None, "Input Zigzags", "Enter number of zigzags:")

# Convert feet input to degrees using the project latitude
distance_north_south_deg = feet_to_degrees(distance_north_south, False)
distance_east_west_deg = feet_to_degrees(distance_east_west, True, project_latitude)

# Function to create a zigzag line
def create_zigzag_line(start_point, distance_ns_deg, distance_ew_deg, zigzags):
    points = [QgsPointXY(start_point.x(), start_point.y())]
    for i in range(zigzags):
        # Move north or south
        direction = 1 if i % 2 == 0 else -1
        new_y = points[-1].y() + (distance_ns_deg * direction)
        points.append(QgsPointXY(points[-1].x(), new_y))
        # Move west
        new_x = points[-1].x() - distance_ew_deg
        points.append(QgsPointXY(new_x, new_y))
    return QgsGeometry.fromPolylineXY(points)

# Function to add a feature to the layer
def add_feature_to_layer(geometry, layer):
    feat = QgsFeature()
    feat.setGeometry(geometry)
    layer.dataProvider().addFeature(feat)
    layer.updateExtents()
    layer.triggerRepaint()

# Create the zigzag line and add it to a layer
def create_and_add_zigzag(start_point):
    # Create a memory layer to store the zigzag line
    line_layer = QgsVectorLayer('LineString?crs=EPSG:4326', 'Zigzag Line', 'memory')
    QgsProject.instance().addMapLayer(line_layer)
    line_layer.startEditing()
    
  
   
    # Create and add the zigzag line
    geom = create_zigzag_line(start_point, distance_north_south_deg, distance_east_west_deg, zigzags)
    add_feature_to_layer(geom, line_layer)
    
    line_layer.commitChanges()

# Map tool to capture the click on the map
class PointTool(QgsMapToolEmitPoint):
    def __init__(self, canvas):
        self.canvas = canvas
        QgsMapToolEmitPoint.__init__(self, self.canvas)

    def canvasReleaseEvent(self, event):
        point = self.toMapCoordinates(event.pos())
        create_and_add_zigzag(point)

# Set the map tool to capture the click
map_tool = PointTool(iface.mapCanvas())
iface.mapCanvas().setMapTool(map_tool)
