# SUSTechPOINTS: Point Cloud 3D Bounding Box Annotation Tool For Autonomous Driving

### Main UI
![screenshot](./doc/main-ui.png)

### Automatic yaw angle (z-axis) prediction.
![auto-rotate](./doc/auto-rotate.gif)

### batch-mode box editing

semi-auto-annotation

![batch-mode](./doc/auto-anno-car.gif)

## Features

- 9 DoF box editing
- Object type/ID/attributes editing
- Interactive/auto box fitting
- Batch-mode editing
- perspective/projective view editing
- Multiple camera images, with auto-camera-switching
- Binary/pcd files for point cloud data
- Jpg/png image files
- Objects/boxes/points coloring
- Focus mode to hide background to check details easily
- Stream play/stop
- Object ID generation



## Get started

[Docker](./doc/docker.md)

[Install from source](./doc/install_from_source.md)

[uwsgi](./doc/deploy_server.md)

## Operations

### Add a new box

You have 2 ways to add a new box:
1. Right click on an object, choose object type in popup context menu
1. Holding Ctrl, draw a rectangle enclosing the object.

Hint: 
1. Adjust the main view so that the objects (e.g. cars) are heading upward or downward along the screen, use 'g' if the direction need to be reversed, use 'r' or 'f' to adjust the yaw angle (z-axis rotation)
1. Adjust the main view so it's almost in bird's eye view. (direct bird's eye view support is not complete yet)



### Main View
```
     mouse scroll up/down:  zoom in/out
     mouse left key hold/move: rotate (change main view)
     mouse right key hold/move: pan

     left click on a box: select
     left click on a selected box: show transform control
     left click on non-box area: hide transform control if present, or unselect box

     Ctrl+mouse drag: add a new box
     Shift+mouse drag: add a new box, w/o automatic box fitting

     Right click to show popup menu.

     -/=: adjust point size

     When transform control is enabled:
          v: switch transform modes among resize/translate/rotate
          z/x/c: turan on/off x/y/z axis
          use mouse to adjust the box.

     del/ctrl+d  remove selected box

     1,2  select previous/next box
     3,4, or pageup/pagedown  show previous/next frame in current scene
     5,6,7  show camera helper box of sideviews.

     space: pause/continue stream play
     
     when a box is selected:
          t: show object trajectory
          del: delete the box
          ctrl+d: delete the box
          a,s,d,w,r,f,g: save as operations in top-view.
          v: enter batch-edit mode

     when transform control in perspective view is active:
          z/x/c: toggle x/y/z asix handle
          v: switch among dimension/rotation/position
```

### sub-view (projective view)
```
     note: 
     - in perspective view, all keyboard operations are same as operating in top-view
     - these shortcuts are applicable when a subview is activated by placing the mouse over it.

     a: move box left
     s: move box down
     d: move box right
     w: move box up
     q: rotate box counterclockwise
     e: rotate box clockwise
     r: rotate box counterclockwise, with box auto-fitting
     f: rotate box clockwise, with box auto-fitting
     g: reverse heading direction (rotate by PI)
     
     double click on center: auto-shrink box by adjusting all borders to nearest innner point.
     double click on border: auto-shrink box by adjusting the border to nearest innner point.
     double click on corner: auto-shrink box by adjusting the corresponding borders to nearest innner point.

     drag border/corner/center: move border/corner/box.
     ctrl + drag border/corner: move border/corner/box with box auto-fitting
     Shft + drag border/corner: move border/corner/box with box auto-fitting while keeping the box size

     mouse scroll up/down: zoom in/out the view
```


### batch-editing mode
```
     t: show object trajectory
     3/pageup: prev batch, or prev object (if one batch shows the whole scene)
     4/pagedown: nex batch, or next object (if one batch shows the whole scene)
     v/Escape: exit batch mode
     +/=/-: increase/decrease point size

     when context menu shown, the underscored char is the corresponding key shortcut.
```

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
