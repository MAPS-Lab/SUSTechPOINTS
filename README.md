# SUSTechPOINTS: Point Cloud 3D Bounding Box Annotation Tool For Autonomous Driving
This is the tool we will be using for annotating data. 

### Main UI
![screenshot](./doc/main-ui.png)


### Automatic yaw angle (z-axis) prediction.
example of labelling a car: Holding Ctrl, draw a rectangle enclosing the object.
![auto-rotate](./doc/auto-rotate.gif)

### batch-mode box editing

this tool also has semi-auto-annotation. Once you have drawn a bounding box for an object you can enter batch mode editing like so

![batch-mode](./doc/auto-anno-car.gif)

or by right clicking an object and clicking `edit multiple instances`.



## Get started

[Docker](./doc/docker.md)

[Install from source](./doc/install_from_source.md)

[uwsgi](./doc/deploy_server.md)

## Operations

[Operations](./doc/operations.md)
[Shortcuts(中文)](./doc/shortcuts_cn.md)

## Cite

If you find this work useful in your research, please consider cite:
```
@INPROCEEDINGS{9304562,
  author={Li, E and Wang, Shuaijun and Li, Chengyang and Li, Dachuan and Wu, Xiangbin and Hao, Qi},
  booktitle={2020 IEEE Intelligent Vehicles Symposium (IV)}, 
  title={SUSTech POINTS: A Portable 3D Point Cloud Interactive Annotation Platform System}, 
  year={2020},
  volume={},
  number={},
  pages={1108-1115},
  doi={10.1109/IV47402.2020.9304562}}
  
```
