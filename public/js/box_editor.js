
import {ProjectiveViewOps}  from "./side_view_op.js"
import {BoxImageContext} from "./image.js";
import {saveWorldList, reloadWorldList} from "./save.js"
import {objIdManager} from "./obj_id_list.js"


/*
2 ways to attach and edit a box
1) attach/detach
2) setTarget, tryAttach, resetTarget, this is only for batch-editor-manager
*/
function BoxEditor(parentUi, boxEditorManager, viewManager, cfg, boxOp, 
    func_on_box_changed, func_on_box_remove, name){
    
    this.boxEditorManager = boxEditorManager;
    this.parentUi = parentUi;
    this.name=name;
    let uiTmpl = document.getElementById("box-editor-ui-template");
    let tmpui = uiTmpl.content.cloneNode(true);  //sub-views
    
    parentUi.appendChild(tmpui);
    this.ui = parentUi.lastElementChild;
    this.boxInfoUi = this.ui.querySelector("#box-info");

    this.viewManager = viewManager;
    this.boxOp = boxOp;
    this.boxView = this.viewManager.addBoxView(this.ui); //this.editorUi.querySelector("#sub-views")
    this.projectiveViewOps = new ProjectiveViewOps(
        this.ui, //this.editorUi.querySelector("#sub-views"),
        cfg,
        this,
        this.boxView.views,
        this.boxOp,
        func_on_box_changed,
        func_on_box_remove);

    this.projectiveViewOps.init_view_operation();

    this.focusImageContext = new BoxImageContext(this.ui.querySelector("#focuscanvas"));
    
    this.target = {};
    this.setTarget = function(world, objTrackId, objType){
        this.target = {
            world: world,
            objTrackId: objTrackId,
            objType: objType,
        }

        this.tryAttach();
        this.ui.style.display="inline-block";
        this.updateInfo();
    };

    this.setIndex = function(index){
        this.index = index; // index as of in all editors.
    };

    this.setSelected = function(selected, eventId){
        if (selected)
        {
            this.ui.className = "selected";
            this.selected = true;
            this.selectEventId = eventId;
        }
        else
        {
            if (!eventId || (this.selectEventId == eventId))
            {
                // cancel only you selected.
                this.ui.className = "";
                this.selected = false;
                this.selectEventId = null;
            }
        }


    }; 

    // this.onContextMenu = (event)=>{
    //     if (this.boxEditorManager)  // there is no manager for box editor in main ui
    //         this.boxEditorManager.onContextMenu(event, this);
    // };

    // this.ui.oncontextmenu = this.onContextMenu;

    this.resetTarget = function(){
        if (this.target.world){
            //unload if it's not the main world


            // if (this.target.world !== this.target.world.data.world)
            //     this.target.world.unload();
        }

        this.detach();
        this.target = {};
        //this.ui.style.display="none";
    };

    this.tryAttach = function(){
        // find target box, attach to me
        if (this.target){

            let box = this.target.world.annotation.findBoxByTrackId(this.target.objTrackId);
            if (box){
                this.attachBox(box);
            }
        }
    };
    

    /*
     the projectiveView tiggers zoomratio changing event.
     editormanager broaccasts it to all editors
    */
    this._setViewZoomRatio = function(viewIndex, ratio){
        this.boxView.views[viewIndex].zoom_ratio = ratio;
    };

    this.updateViewZoomRatio = function(viewIndex, ratio){
        //this.upate();
        if (this.boxEditorManager)
            this.boxEditorManager.updateViewZoomRatio(viewIndex, ratio);
        else{
            this._setViewZoomRatio(viewIndex, ratio);
            this.update();
            //this.viewManager.render();            
        }
    };


    this.box = null;
    this.attachBox = function(box){
        if (this.box && this.box !== box){
            this.box.boxEditor=null;
            console.log("detach box editor");
            //todo de-highlight box
        }

        this.box = null;
        this.show();

        if (box){
            box.boxEditor = this;
            this.box=box;
            //this.boxOp.highlightBox(box);
            this.boxView.attachBox(box);
            this.projectiveViewOps.attachBox(box);
            this.focusImageContext.updateFocusedImageContext(box);

            this.updateInfo();
            this.boxView.render();
        }

        

    };

    this.detach = function(dontHide){
        if (this.box){
            if (this.box.boxEditor === this){
                this.box.boxEditor = null;
            }
            //this.boxOp.unhighlightBox(this.box);
            //todo de-highlight box
            this.projectiveViewOps.detach();
            this.boxView.detach();
            this.focusImageContext.clear_canvas();
            this.box = null;
        }

        if (!dontHide)
            this.hide();
    };

    
    

    this.hide = function(){
        this.ui.style.display="none";


        // this is a hack, if we don't have manager, this is the main editor
        // hide parent ui
        // todo, add a pseudo manager, hide itself when child hide
        if (!this.boxEditorManager){
            this.parentUi.style.display="none";
        }
    }
    this.show = function(){
        this.ui.style.display="";//"inline-block";
        if (!this.boxEditorManager){
            this.parentUi.style.display="";
        }

        

    }

    this.onBoxChanged=function(){
        
        this.projectiveViewOps.update_view_handle();
        this.focusImageContext.updateFocusedImageContext(this.box);
        this.boxView.onBoxChanged();

        // mark
        delete this.box.annotator; // human annotator doesn't need a name
        delete this.box.follows;
        this.box.changed = true;
        
        // don't mark world's change flag, for it's hard to clear it.
        
        // inform boxEditorMgr to transfer annotation to other frames.
        if (this.boxEditorManager)
            this.boxEditorManager.onBoxChanged(this);

        this.updateInfo();

        //this.boxView.render();
    };

    this.onDelBox = function(){
        let box = this.box;
        this.detach("donthide");


    };

    // windowresize...
    this.update = function(dontRender=false){
        if (this.box === null)
            return;

        this.projectiveViewOps.update_view_handle();
        
        if (this.boxView){
            this.boxView.updateCameraRange(this.box);
            this.boxView.updateCameraPose(this.box);

            if (!dontRender) 
                this.boxView.render();
        }
        
        // this is not needed somtime
        this.focusImageContext.updateFocusedImageContext(this.box); 

        // should we update info?
        this.updateInfo();
    };

    this.updateInfo = function(){
        let info = ""
        if (this.target.world)
            info  += String(this.target.world.frameInfo.frame);
        
        if (this.box && this.box.annotator)
            info += ","+this.box.annotator;

        if (this.box && this.box.changed)
            info += " *";

        this.boxInfoUi.innerHTML = info;
    };

    this.updateBoxDimension = function(){

    };


    this.resize = function(width, height)
    {
        // if (height + "px" == this.ui.style.height &&  width + "px" == this.ui.style.width)
        // {
        //     return;
        // }

        this.ui.style.width = width + "px";
        this.ui.style.height = height + "px";
        this.boxView.render();
    };

    this.setResize = function(option){
        this.ui.style.resize=option;
        this.ui.style["z-index"] = "0";

        if (option == 'both')
        {

            this.lastSize= {
                width: 0,
                height: 0,
            };

            this.resizeObserver = new ResizeObserver(elements=>{

                let rect = elements[0].contentRect;
                console.log("sub-views resized.", rect);
        
                if (rect.height == 0 || rect.width == 0)
                {
                    return;
                }

                if (rect.height != this.lastSize.height || rect.width != this.lastSize.width)
                {
                    // viewManager will clear backgound
                    // so this render is effectiveless.
                    //this.boxView.render();

                    // save                     

                    if (this.boxEditorManager)  // there is no manager for box editor in main ui
                    {
                        pointsGlobalConfig.setItem("batchModeSubviewSize", {width: rect.width, height: rect.height});
                        this.boxEditorManager.onSubViewsResize(rect.width, rect.height);
                    }
                    else{
                        this.boxView.render();
                    }
                
                    //save
                    this.lastSize.width = rect.width;
                    this.lastSize.height = rect.height;
                }

                

            });
        
            this.resizeObserver.observe(this.ui);
        }
    }
}


//parentUi  #batch-box-editor
function BoxEditorManager(parentUi, viewManager, objectTrackView, 
                 cfg, boxOp, globalHeader, contextMenu, configMenu,
                 func_on_box_changed, func_on_box_remove, func_on_annotation_reloaded){
    this.viewManager = viewManager;
    this.objectTrackView = objectTrackView;
    this.boxOp = boxOp;
    this.activeIndex = 0;
    this.editorList = [];
    this.cfg = cfg;
    this.globalHeader = globalHeader;
    this.contextMenu = contextMenu;
    this.parentUi = parentUi;   //#batch-box-editor
    this.boxEditorGroupUi = parentUi.querySelector("#batch-box-editor-group");
    this.boxEditorHeaderUi = parentUi.querySelector("#batch-box-editor-header");
    this.batchSize = cfg.batchModeInstNumber;
    //this.configMenu = configMenu;
    
    this.activeEditorList = function(){
        return this.editorList.slice(0, this.activeIndex);
    };

    this.editingTarget = {
        data: null,
        sceneMeta: "",
        objTrackId: "",
        frame:"",
        frameIndex: NaN,
    };
    
    this.onExit = null;
    // frame specifies the center frame to edit
    
    
    // this.parentUi.addEventListener("contextmenu", event=>{
    //     this.contextMenu.show("boxEditorManager", event.clientX, event.clientY, this);
    //     event.stopPropagation();
    //     event.preventDefault();
    // })
    
    this.onSubViewsResize = function(width, height)
    {
        this.viewManager.mainView.clearView();
        this.editorList.forEach(e=>{
            e.resize(width, height);
        });

        //this.viewManager.render();
    };

    this.calculateBestSubviewSize=function(batchSize)
    {
        let parentRect = this.parentUi.getBoundingClientRect();
        let headerRect = this.boxEditorHeaderUi.getBoundingClientRect();
        let editorsGroupRect = this.boxEditorGroupUi.getBoundingClientRect();

        let availableHeight = parentRect.height - headerRect.height;
        let availableWidth = parentRect.width;

        if (availableHeight ==0 || availableWidth ==0)
        {
            this.batchSizeUpdated=true;
            return;
        }


        let defaultBoxWidth=130;
        let defaultBoxHeight=450;

        let rows = 1;
        let w = availableWidth/Math.ceil(batchSize/rows);
        let h = availableHeight/rows;
        let cost = Math.abs((w/h) - (defaultBoxWidth/defaultBoxHeight));
        let minCost = cost;
        let bestRows = rows;
        while(true)
        {
            rows +=1;

            let w = Math.floor(availableWidth/Math.ceil(batchSize/rows));
            let h = Math.floor(availableHeight/rows);
            let cost = Math.abs((w/h) - (defaultBoxWidth/defaultBoxHeight));
            
            if (cost < minCost)
            {
                minCost = cost;                
                bestRows = rows;
            }
            else{
                break;
            }
        }        
    
        //bestRows
        pointsGlobalConfig.batchModeSubviewSize = {
            width: Math.floor(availableWidth/Math.ceil(batchSize/bestRows)),
            height: Math.floor(availableHeight/bestRows),
        }
    }

    this.setBatchSize = function(batchSize)
    {
        this.calculateBestSubviewSize(batchSize);

        this.batchSize = batchSize;
        if (this.parentUi.style.display != "none")
        {
            

            this.edit(  this.editingTarget.data,
                        this.editingTarget.sceneMeta,
                        this.editingTarget.frame,
                        this.editingTarget.objTrackId,
                        this.editingTarget.objType
                    );
        }
    };

    this.edit = function(data, sceneMeta, frame, objTrackId, objType, onExit){
        
        this.show();
        this.reset();

        if (this.batchSizeUpdated)
        {
            this.batchSizeUpdated=false;
            this.calculateBestSubviewSize(this.batchSize);
        }


        if (onExit){
            // next/prev call will not update onExit
            this.onExit = onExit;
        }
        let sceneName = sceneMeta.scene;

        this.editingTarget.data = data;
        this.editingTarget.sceneMeta = sceneMeta;
        this.editingTarget.objTrackId = objTrackId;

        
        this.editingTarget.objType = objType;

        this.editingTarget.frame = frame;

        // this.parentUi.querySelector("#object-track-id-editor").value=objTrackId;
        // this.parentUi.querySelector("#object-category-selector").value=objType;
        

        let centerIndex = sceneMeta.frames.findIndex(f=>f==frame);
        this.editingTarget.frameIndex = centerIndex;

        if (centerIndex < 0){
            centerIndex = 0;
        }


        let startIndex = Math.max(0, centerIndex - this.batchSize/2);

        if(startIndex > 0)
        {
            if (startIndex + this.batchSize > sceneMeta.frames.length)
            {
                startIndex -= startIndex + this.batchSize - sceneMeta.frames.length;

                if (startIndex < 0)
                {
                    startIndex = 0;
                }
            }            
        }

        

        let frames = sceneMeta.frames.slice(startIndex, startIndex+this.batchSize);

        
        this.viewManager.mainView.clearView();

        frames.forEach(async (frame, editorIndex)=>{
            let world = await data.getWorld(sceneName, frame);
            let editor = this.addEditor();
            editor.setTarget(world, objTrackId, objType);
            editor.setIndex(editorIndex);
            editor.resize(pointsGlobalConfig.batchModeSubviewSize.width, pointsGlobalConfig.batchModeSubviewSize.height);
            
            data.activate_world(world, 
                ()=>{
                    editor.tryAttach();
                    //
                    //this.viewManager.render();
                },
                true);
        });

        
    };
    
    this.onContextMenu = function(event, boxEditor)
    {
        this.firingBoxEditor = boxEditor;

        if (boxEditor.selected)
        {
            // ok
        }
        else
        {
            this.getSelectedEditors().forEach(e=>e.setSelected(false));
            boxEditor.setSelected(true);
        }

        this.contextMenu.show("boxEditor", event.clientX, event.clientY, this);
        event.stopPropagation();
        event.preventDefault();
    };

    this.parentUi.oncontextmenu = (event)=>{
        let ed = this.getEditorByMousePosition(event.clientX, event.clientY);

        this.onContextMenu(event, ed);
    };


    this.handleContextMenuEvent = function(event)
    {
        console.log(event.currentTarget.id, event.type);
        switch(event.currentTarget.id)
        {

        // manager
        case 'cm-increase-box-editor':
            this.batchSize += 1;
            this.edit(
                this.editingTarget.data,
                this.editingTarget.sceneMeta,
                this.editingTarget.sceneMeta.frame,
                this.editingTarget.objTrackId,
                this.editingTarget.objType
            );
            break;

        case 'cm-decrease-box-editor':
            this.batchSize -= 1;
            this.edit(
                this.editingTarget.data,
                this.editingTarget.sceneMeta,
                this.editingTarget.sceneMeta.frame,
                this.editingTarget.objTrackId,
                this.editingTarget.objType
            );
            break;

        /////////////////////// obj instance //

        case 'cm-select-all':
            this.activeEditorList().forEach(e=>e.setSelected(true));
            break;
        case 'cm-select-all-previous':
            this.activeEditorList().forEach(e=> e.setSelected(e.index <= this.firingBoxEditor.index));
            break;
        case 'cm-select-all-next':
            this.activeEditorList().forEach(e=> e.setSelected(e.index >= this.firingBoxEditor.index));
            break
            
        case 'cm-delete':
            {

                let selectedEditors = this.getSelectedEditors();

                if (selectedEditors.length >= 2)
                {
                    window.editor.infoBox.show(
                        "Confirm",
                        `Delete <span class="red">${selectedEditors.length}</span> selected boxes?`,
                        ["yes", "no"],
                        (btn)=>{
                            if (btn == "yes")
                            {

                                selectedEditors.forEach(e=>{
                                    if (e.box)  
                                        func_on_box_remove(e.box, true)
                                });   
                            }
                        },
                        {x: event.clientX, y: event.clientY}
                    );
                }
                else{
                    selectedEditors.forEach(e=>{
                        if (e.box)  
                            func_on_box_remove(e.box, true)
                    });
                }         
            }   
            break;
        case 'cm-interpolate':
            {
                let applyIndList = this.activeEditorList().map(e=>false); //all shoud be applied.
                let selectedEditors = this.getSelectedEditors();

                // if interpolate only one box, remove it if exist.
                // no matter who is the annotator.
                if (selectedEditors.length == 1)
                {
                    if (selectedEditors[0].box)
                    {
                        func_on_box_remove(selectedEditors[0].box, true);
                    }
                }

                selectedEditors.forEach(e=>applyIndList[e.index] = true);
                this.interpolate(applyIndList);
            }
            break;
        
        case 'cm-auto-annotate':
            {
                let applyIndList = this.activeEditorList().map(e=>false); //all shoud be applied.
                this.getSelectedEditors().forEach(e=>applyIndList[e.index] = true);
                this.autoAnnotate(applyIndList);
            }
            break;
        
        case 'cm-auto-annotate-wo-rotation':
            {
                let applyIndList = this.activeEditorList().map(e=>false); //all shoud be applied.
                this.getSelectedEditors().forEach(e=>applyIndList[e.index] = true);
                this.autoAnnotate(applyIndList, "dontrotate");
            }
            break;

        case 'cm-fit-moving-direction':
            this.getSelectedEditors().forEach(e=>{
                if (!e.box) 
                    return;

                let currentBox = e.box;
                let estimatedRot = boxOp.estimate_rotation_by_moving_direciton(currentBox);
                
                currentBox.rotation.z = estimatedRot.z;
                func_on_box_changed(currentBox);  
            });
            break;
        case 'cm-fit-size':
            this.getSelectedEditors().forEach(e=>{
                if (!e.box) 
                    return;

                boxOp.auto_rotate_xyz(e.box, null, 
                    null,//{x:false, y:false, z:true}, 
                    func_on_box_changed, null, "dontrotate");
            });
            break;
        case 'cm-fit-position':
            this.getSelectedEditors().forEach(e=>{
                if (!e.box) 
                    return;
                boxOp.auto_rotate_xyz(e.box, null, 
                    null,//{x:false, y:false, z:true}, 
                    func_on_box_changed, "noscaling", "dontrotate");
            });
            break;
        case 'cm-fit-rotation':
            this.getSelectedEditors().forEach(e=>{
                if (!e.box) 
                    return;
                boxOp.auto_rotate_xyz(e.box, null, 
                    null, 
                    func_on_box_changed, "noscaling");
            });
            break;
        case 'cm-finalize':
            {
                this.getSelectedEditors().forEach(e=>{
                
                    if (e.box){
                        if (e.box.annotator)
                        {
                            delete e.box.annotator;
                            func_on_box_changed(e.box);
                            //e.box.world.annotation.setModified();
                            e.updateInfo();
                        }
                    }
                });

                this.globalHeader.updateModifiedStatus();;
            }
            break;
            
        case 'cm-reload':
            
            {
                let selectedEditors = this.getSelectedEditors();
                this.reloadAnnotation(selectedEditors);  
            }
            break;

        case 'cm-goto-this-frame':
            {            
                let targetFrame = this.firingBoxEditor.target.world.frameInfo.frame;
                this.hide();

                this.reset();
                if (this.onExit)
                    this.onExit(targetFrame);
            }
            break;
        };


        return true;
    };

    this.reset = function(){
        this.activeEditorList().forEach(e=>e.resetTarget());
        this.viewManager.mainView.clearView();
        this.activeIndex = 0;
    };


    this.keydownHandler = (event)=>{

        switch(event.key){
            case 's':
                if (event.ctrlKey){
                    this._save();
                    console.log("saved for batch editor");
                }
                break;
            case '+':
            case '=':
                this.editingTarget.data.scale_point_size(1.2);
                this.viewManager.render();
                break;
            case '-':
                this.editingTarget.data.scale_point_size(0.8);
                this.viewManager.render();
                break;
            case 'Escape':
                this.hide();
                this.reset();
                if (this.onExit)
                    this.onExit();
                break;                
            case 'PageUp':
            case 'PageDown':
                break;
            default:
                break;
        }
    };


    let keydownHandler = (event)=>this.keydownHandler(event);


    this.hide =function(){
        this.parentUi.style.display = "none";
        this.toolbox.style.display = "none";
        document.removeEventListener("keydown", keydownHandler);

    };
    this.show = function(){
        this.parentUi.style.display = "";
        document.addEventListener("keydown", keydownHandler);
        this.toolbox.style.display = "";
    };

    this.render =function()
    {
        if (this.parentUi.style.display != "none")
        {
            this.viewManager.render();
        }
    };

    this.onBoxChanged= function(editor){

        //let boxes = this.editorList.map(e=>e.box); //some may be null, that's ok
        //this.boxOp.interpolateSync(boxes);
        // if (this.cfg.enableAutoSave)
        //     this._saveAndTransfer();
    };

    
    
    this._addToolBox = function(){
        let template = document.getElementById("batch-editor-tools-template");
        let tool = template.content.cloneNode(true);
        // this.boxEditorHeaderUi.appendChild(tool);
        // return this.boxEditorHeaderUi.lastElementChild;

        document.getElementById("dynamic-buttons-placeholder").appendChild(tool);
        return document.getElementById("dynamic-buttons-placeholder").lastElementChild;
    };

    this.toolbox = this._addToolBox();

    this.reloadAnnotation = function(editorList){
        
        let done = (anns)=>{
            // update editor
            editorList.forEach(e=>{
                e.tryAttach();
                e.update("dontrender");
            });

            // reload main view
            if (func_on_annotation_reloaded)
                func_on_annotation_reloaded();
            // render all, at last

            this.viewManager.render();

            this.globalHeader.updateModifiedStatus();
        };


        let worldList = editorList.map(e=>e.target.world);

        let modifiedFrames  =worldList.filter(w=>w && w.annotation.modified);

        if (modifiedFrames.length > 0)
        {
            window.editor.infoBox.show(
                "Confirm",
                `Discard changes to ${modifiedFrames.length} frames, continue to reload?`,
                ["yes","no"],
                (choice)=>{
                    if (choice=="yes")
                    {
                        reloadWorldList(worldList, done);
                    }
                }
            );
        }
        else{
            reloadWorldList(worldList, done);
        }


        
    }

    this.interpolate = async function(applyIndList){
        let boxList = this.activeEditorList().map(e=>e.box);        
        let worldList = this.activeEditorList().map(e=>e.target.world);
        await this.boxOp.interpolateAsync(worldList, boxList, applyIndList);
        this.activeEditorList().forEach(e=>e.tryAttach());

        this.globalHeader.updateModifiedStatus();
        this.viewManager.render();
    };

    this.autoAnnotate = async function(applyIndList, dontRotate){
        let editors = this.activeEditorList();
        let boxList = editors.map(e=>e.box);
        let worldList = editors.map(e=>e.target.world);

        let onFinishOneBox = (i)=>{
            editors[i].tryAttach();
            this.viewManager.render();
        }
        
        await this.boxOp.interpolateAndAutoAdjustAsync(worldList, boxList, onFinishOneBox, applyIndList, dontRotate);

        this.globalHeader.updateModifiedStatus();
    }

    this.adjustRotationByMovingDirection = function()
    {
        let currentBox = this.firingBoxEditor.box;
        let estimatedRot = boxOp.estimate_rotation_by_moving_direciton(currentBox);
        
        currentBox.rotation.z = estimatedRot.z;
        func_on_box_changed(currentBox);
    }


    // this.parentUi.querySelector("#object-track-id-editor").addEventListener("keydown", function(e){
    //     e.stopPropagation();});
    
    // this.parentUi.querySelector("#object-track-id-editor").addEventListener("keyup", function(e){
    //     e.stopPropagation();
    // });

    // this.parentUi.querySelector("#object-track-id-editor").onchange = (ev)=>this.object_track_id_changed(ev);
    // this.parentUi.querySelector("#object-category-selector").onchange = (ev)=>this.object_category_changed(ev);


    // this should follow addToolBox

    // this.parentUi.querySelector("#instance-number").value = this.batchSize;
    // this.parentUi.querySelector("#instance-number").onchange = (ev)=>{
    //     this.batchSize = parseInt(ev.currentTarget.value);
    //     this.edit(
    //         this.editingTarget.data,
    //         this.editingTarget.sceneMeta,
    //         this.editingTarget.frame,
    //         this.editingTarget.objTrackId,
    //         this.editingTarget.objType
    //     );
    // }

    this.toolbox.querySelector("#trajectory").onclick = (e)=>{
        let tracks = this.editingTarget.data.worldList.map(w=>{
            let box = w.annotation.findBoxByTrackId(this.editingTarget.objTrackId);
            let ann = null;
            if (box){
                ann = w.annotation.boxToAnn(box);
                ann.psr.position = w.lidarPosToUtm(ann.psr.position);
                ann.psr.rotation = w.lidarRotToUtm(ann.psr.rotation);
            } 
            return [w.frameInfo.frame, ann, false];
        });

        tracks.sort((a,b)=> (a[0] > b[0])? 1 : -1);

        this.objectTrackView.setObject(
            this.editingTarget.objType,
            this.editingTarget.objTrackId,
            tracks,
            (targetFrame)=>{  //onExit
                this.getSelectedEditors(e=>e.setSelected(false));
                this.activeEditorList().find(e=>e.target.world.frameInfo.frame == targetFrame).setSelected(true);
            }
        );
    };

    this.toolbox.querySelector("#reload").onclick = (e)=>{

        let selectedEditors = this.activeEditorList();
        this.reloadAnnotation(selectedEditors);  
    };

    this.toolbox.querySelector("#interpolate").onclick = async ()=>{
        //this.boxOp.interpolate_selected_object(this.editingTarget.scene, this.editingTarget.objTrackId, "");
        
        let applyIndList = this.activeEditorList().map(e=>true); //all shoud be applied.
        this.interpolate(applyIndList);
        
    };

    this.toolbox.querySelector("#auto-annotate").onclick = async ()=>{
        let applyIndList = this.activeEditorList().map(e=>true); //all shoud be applied.
        this.autoAnnotate(applyIndList);
    };

    this.toolbox.querySelector("#auto-annotate-translate-only").onclick = async ()=>{
        let applyIndList = this.activeEditorList().map(e=>true); //all shoud be applied.
        this.autoAnnotate(applyIndList, "dontrotate");
    };

    this.toolbox.querySelector("#exit").onclick = ()=>{
        this.hide();

        this.reset();

        if (this.onExit)
            this.onExit();
    };

    this.toolbox.querySelector("#next").onclick = ()=>{
        let maxFrameIndex = this.editingTarget.sceneMeta.frames.length-1;
        this.edit(
            this.editingTarget.data,
            this.editingTarget.sceneMeta,
            this.editingTarget.sceneMeta.frames[Math.min(this.editingTarget.frameIndex + this.batchSize/2, maxFrameIndex)],
            this.editingTarget.objTrackId,
            this.editingTarget.objType
        );
    };

    this.toolbox.querySelector("#prev").onclick = ()=>{
        this.edit(
            this.editingTarget.data,
            this.editingTarget.sceneMeta,
            this.editingTarget.sceneMeta.frames[Math.max(this.editingTarget.frameIndex - this.batchSize/2, 0)],
            this.editingTarget.objTrackId,
            this.editingTarget.objType
        );
    };

    // this.toolbox.querySelector("#save").onclick = ()=>{
    //     this._save();
    // };

    this.toolbox.querySelector("#finalize").onclick = ()=>{
        this.finalize();
    };

    this.finalize = function(){
        this.activeEditorList().forEach(e=>{
            if (e.box){

                if (e.box.annotator){
                    delete e.box.annotator;
                    func_on_box_changed(e.box);
                }
                e.box.world.annotation.setModified();
                e.updateInfo();
            }
        });

        this.globalHeader.updateModifiedStatus();
    };

    this.object_track_id_changed = function(event){
        var id = event.currentTarget.value;

        if (id == "new"){
            id = objIdManager.generateNewUniqueId();
            this.parentUi.querySelector("#object-track-id-editor").value=id;
        }

        this.activeEditorList().forEach(e=>{
            if (e.box){
                e.box.obj_track_id = id;
            }
        });

    };

    this.object_category_changed = function(event){
        let obj_type = event.currentTarget.value;
        this.activeEditorList().forEach(e=>{
            if (e.box){
                e.box.obj_type = obj_type;
            }
        });
    };


    this._save = function(){
        let worldList = []
        let editorList = []
        this.activeEditorList().forEach(e=>{
            worldList.push(e.target.world);
            editorList.push(e);
        });

        let doneSave = ()=>{
            editorList.forEach(e=>{
                if (e.box)
                    e.box.changed = false;
                e.updateInfo();
            });

            this.globalHeader.updateModifiedStatus();
            
        };

        saveWorldList(worldList, doneSave);
    }


    this.updateViewZoomRatio = function(viewIndex, ratio){
        const dontRender=true;
        this.activeEditorList().forEach(e=>{
            e._setViewZoomRatio(viewIndex, ratio);
            e.update(dontRender);
        })

        // render all
        this.viewManager.render();
    }

    this.addEditor = function(){
        let editor = this.allocateEditor();
        this.activeIndex += 1;
        return editor;
    };

    this.allocateEditor = function(){
        if (this.activeIndex >= this.editorList.length){
            let editor = new BoxEditor(this.boxEditorGroupUi, this, this.viewManager, cfg, this.boxOp, func_on_box_changed, func_on_box_remove, String(this.activeIndex));
            
            // resizable for the first editor

            if (this.editorList.length == 0)
            {
                editor.setResize("both");
            }
            
            this.editorList.push(editor);

            return editor;
        }else{
            return this.editorList[this.activeIndex];
        }
    };


    this.getEditorByMousePosition = function(x,y){

        return this.editorList.find(e=>{
            let rect = e.ui.getBoundingClientRect();

            return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
        })
    };
    

    this.parentUi.onmousedown= (event)=>{

        if (event.which!=1)
            return;

        let eventId = Date.now();

        let select_start_pos={
            x: event.clientX,
            y: event.clientY,
        } 

        console.log("box editor manager, on mouse down.", select_start_pos);

        let select_end_pos={
            x: event.clientX,
            y: event.clientY,
        } 

        let leftMouseDown = true;
        
        // a1<a2, b1<b2
        function lineIntersect(a1, a2, b1, b2)
        {
            if (a1 > a2) [a1,a2]=[a2,a1];
            if (b1 > b2) [b1,b2]=[b2,b1];

            return (a1 > b1 && a1 < b2) || (a2 > b1 && a2 < b2) || (b1 > a1 && b1 < a2) || (b2 > a1 && b2 < a2) 
        }

        // a,b: left, right, right, bottom
        function intersect(domRect, mouseA, mouseB){
            return (lineIntersect(select_end_pos.x, select_start_pos.x, domRect.left, domRect.right) &&
                    lineIntersect(select_end_pos.y, select_start_pos.y, domRect.top, domRect.bottom))
        }

              

        this.parentUi.onmousemove = (event)=>{
            select_end_pos.x = event.clientX;
            select_end_pos.y = event.clientY;

            this.editorList.forEach(e=>{
                let rect = e.ui.getBoundingClientRect();
                let intersected = intersect(rect, select_start_pos, select_end_pos);
                
                e.setSelected(intersected, event.ctrlKey?eventId:null);
                
            })
        }

        this.parentUi.onmouseup = (event) =>{
            if (event.which!=1)
                return;

            leftMouseDown = false;
            this.parentUi.onmousemove = null;
            this.parentUi.onmouseup = null;


            if (event.clientX == select_start_pos.x && event.clientY == select_start_pos.y)
            { // click

                let ed = this.getEditorByMousePosition(event.clientX, event.clientY);


                if (event.shiftKey)
                {
                    let selectedEditors = this.getSelectedEditors();
                    if (selectedEditors.length == 0)
                    {
                        
                    }
                    else if (ed.index < selectedEditors[0].index)
                    {
                        this.activeEditorList().forEach(e=>{
                            if (e.index >= ed.index && e.index < selectedEditors[0].index){
                                e.setSelected(true);
                            }
                        });
                    }
                    else if (ed.index > selectedEditors[selectedEditors.length-1].index)
                    {
                        this.activeEditorList().forEach(e=>{
                            if (e.index <= ed.index && e.index > selectedEditors[selectedEditors.length-1].index){
                                e.setSelected(true);
                            }
                        });                        
                    }
                }
                else if (event.ctrlKey)
                {
                    ed.setSelected(!ed.selected);
                }
                else
                {
                    let selectedEditors = this.getSelectedEditors();
                    
                    
                    if (ed){
                        if (ed.selected &&  selectedEditors.length == 1)
                        {
                            ed.setSelected(false);
                        }
                        else
                        {
                            selectedEditors.forEach(e=>e.setSelected(false));                            
                            ed.setSelected(true);
                        }
                    }
                    else{
                        selectedEditors.forEach(e=>e.setSelected(false));
                    }
                }
            }
        }
    }

    this.getSelectedEditors = function(){
        return this.editorList.filter(e=>e.selected);
    }

}
export {BoxEditorManager, BoxEditor};