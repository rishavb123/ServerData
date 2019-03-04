import React, { Component } from 'react';

import { Table, TabContent, TabPane, Navbar, NavbarBrand, Nav, NavItem, NavLink, DropdownToggle, UncontrolledDropdown, DropdownMenu, DropdownItem, Modal, ModalBody, ModalHeader, ModalFooter, Form, FormGroup, FormText, Button, Label, Input } from 'reactstrap';

import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-dark.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';

import Toggle from "react-toggle-component"
import "react-toggle-component/styles.css"

import Plot from 'react-plotly.js';

import csv from 'csv';

import axios from 'axios';

import data from './data/data.json'

import firebase from './firebase.js'

let playerX = 0;
function shiftX() {
    return 0.2*document.documentElement.clientWidth - playerX;
}

let playerY = 0;
function shiftY() {
    return .25*document.documentElement.clientHeight - playerY;
}

function intersectRect(r1, r2) {
    return !(r2.left > r1.right || 
             r2.right < r1.left || 
             r2.top > r1.bottom ||
             r2.bottom < r1.top);
}

class Player {
    
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        playerX = this.x;
        playerY = this.y;
        this.angle = angle;
        this.radius = 20;
        this.shiftAngle = 40;
        this.v = 6;
        this.attacking = 0;
        this.attackCounter = 0;
        this.controller = {
            left: false,
            right: false,
            forward: false,
            back: false
        }
        this.drawX = 0.2*document.documentElement.clientWidth;
        this.drawY = 0.25*document.documentElement.clientHeight;
    }

    updateAngle(mouse) {
        this.mouse = mouse;
        if(!mouse)
            this.angle = 0;
        else if(mouse.x === this.drawX)
            this.angle = 0;
        else
            this.angle = (mouse.x - this.drawX > 0)? Math.atan((mouse.y - this.drawY)/(mouse.x - this.drawX))*180.0/Math.PI: Math.atan((mouse.y - this.drawY)/(mouse.x - this.drawX))*180.0/Math.PI + 180;
    }

    move(direction) {
        let atAngle = (angle) => {
            this.x += this.v*Math.cos(angle*Math.PI/180.0);
            this.y += this.v*Math.sin(angle*Math.PI/180.0);
        };
        switch(direction)
        {
            case "forward":
                atAngle(this.angle);
                break;
            case "back":
                atAngle(this.angle+180);
                break;
            case "left":
                atAngle(this.angle-90);
                break;
            case "right":
                atAngle(this.angle+90);
                break;
            default:
                break;
        }
        playerX = this.x;
        playerY = this.y;
        this.updateAngle(this.mouse);
    }

    attack() {
        this.attacking = 14;
        this.attackCounter++;
    }

    draw(ctx) {
        
        if(this.controller.left)
            this.move("left");
        if(this.controller.right)
            this.move("right");
        if(this.controller.forward)
            this.move("forward");
        if(this.controller.back)
            this.move("back");        

        ctx.fillStyle = "#ffd9b3";

        ctx.beginPath();
        ctx.arc(this.drawX, this.drawY, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        let attackDistance = 7 - Math.abs(this.attacking-7);

        if(this.attacking && this.attackCounter%2===0)
            this.radius*=1+(attackDistance/20);

        ctx.beginPath();
        ctx.arc(this.drawX+this.radius*Math.cos((this.angle+this.shiftAngle)*Math.PI/180.0), this.drawY+this.radius*Math.sin((this.angle+this.shiftAngle)*Math.PI/180.0), this.radius/3.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        if(this.attacking && this.attackCounter%2===1)
            this.radius*=1+(attackDistance/20);
        if(this.attacking && this.attackCounter%2===0)
            this.radius/=1+(attackDistance/20);

        ctx.beginPath();
        ctx.arc(this.drawX+this.radius*Math.cos((this.angle-this.shiftAngle)*Math.PI/180.0), this.drawY+this.radius*Math.sin((this.angle-this.shiftAngle)*Math.PI/180.0), this.radius/3.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        if(this.attacking && this.attackCounter%2===1)
            this.radius/=1+(attackDistance/20);

        if(this.attacking)
            this.attacking-=2;
    }

    getPunchingHand() {
        let attackDistance = 7 - Math.abs(this.attacking-7);
        if(!this.attacking)
            return null;
        if(this.attackCounter%2 === 0)
            return {
                left: this.x + (1+(attackDistance/20))*this.radius*Math.cos((this.angle+this.shiftAngle)*Math.PI/180.0) - (1+(attackDistance/20))*this.radius,
                right: this.x + (1+(attackDistance/20))*this.radius*Math.cos((this.angle+this.shiftAngle)*Math.PI/180.0) + (1+(attackDistance/20))*this.radius,
                top: this.y + (1+(attackDistance/20))*this.radius*Math.sin((this.angle+this.shiftAngle)*Math.PI/180.0) - (1+(attackDistance/20))*this.radius,
                bottom: this.y + (1+(attackDistance/20))*this.radius*Math.sin((this.angle+this.shiftAngle)*Math.PI/180.0) + (1+(attackDistance/20))*this.radius
            };
        else
            return {
                left: this.x + (1+(attackDistance/20))*this.radius*Math.cos((this.angle-this.shiftAngle)*Math.PI/180.0) - (1+(attackDistance/20))*this.radius,
                right: this.x + (1+(attackDistance/20))*this.radius*Math.cos((this.angle-this.shiftAngle)*Math.PI/180.0) + (1+(attackDistance/20))*this.radius,
                top: this.y + (1+(attackDistance/20))*this.radius*Math.sin((this.angle-this.shiftAngle)*Math.PI/180.0) - (1+(attackDistance/20))*this.radius,
                bottom: this.y + (1+(attackDistance/20))*this.radius*Math.sin((this.angle-this.shiftAngle)*Math.PI/180.0) + (1+(attackDistance/20))*this.radius
            }
    }

}

class Server {

    constructor(data, x, y, theme) {
        if(data && data.hostname)
            this.hostname = data.hostname;
        if(data && data.area)
            this.area = data.area;
        if(data && data.version)
            this.version = data.version;
        if(data && data.uptime)
            this.uptime = data.uptime;
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;
        this.health = 100;
        this.theme = theme;
    }

    getRect() {
        return {
            left: this.x,
            top: this.y,
            right: this.x+this.width,
            bottom: this.y+this.height
        };
    }

    draw(ctx) {
        if(this.health > 0)
        {
            ctx.fillStyle = `rgb(${((this.theme === "light")? 255: 200) - this.health},${(this.theme === "light")? 155: 100},${(this.theme === "light")? 155: 100})`;
            ctx.fillRect(this.x+shiftX(), this.y+shiftY(), this.width, this.height);
            ctx.rect(this.x+shiftX(), this.y+shiftY(), this.width, this.height);
            ctx.fillStyle="black";
            ctx.font = "7px Arial";
            ctx.fillText(this.hostname, this.x+shiftX()+1,this.y+shiftY()+10);
            ctx.fillText(this.area, this.x+shiftX()+1,this.y+shiftY()+21);
            ctx.fillText(this.version, this.x+shiftX()+1,this.y+shiftY()+31);
            ctx.fillText(this.uptime, this.x+shiftX()+1,this.y+shiftY()+41);
        }
    }

}

class Canvas extends Component {

    constructor() {
        super();
        
        this.updateCanvas = this.updateCanvas.bind(this);
    }

    componentDidMount() {
        this.ctx = this.refs.canvas.getContext('2d');
        this.canvasRect = this.refs.canvas.getBoundingClientRect();
        this.player = new Player(150, 150, 0);
        this.servers = {};
        this.numOfAddedServers = 0;
        let data = (this.props.data)? this.props.data.sort((a,b) => (a.area > b.area) ? 1 : ((b.area > a.area) ? -1 : 0)): []; 
        let currentArea = (data && data.length > 0)? data[0].area: "area";
        this.currentArea = currentArea;
        let areaShift = 0;
        this.healing = false;
        this.bgColorIndex = 0;

        this.colors = {
            dark: ['#b30000', '#262673', '#000000', '#267326', '#666600', '#800080', '#33334d' ,'#004d4d'],
            light: ['#ffcccc', '#8c8cd9', '#ffffff', '#b3e6b3', '#ffff33', '#ff4dff', '#c2c2d6', '#99ffff']
        }

        /*eslint-disable */
        for(let i=0; i<data.length; i++) {
            const xWithoutShift = 10+60*Math.floor(i/4);
            if(data[i].area != currentArea)
            {
                areaShift+=100;
                currentArea = data[i].area;
                i--;
                continue;
            }
            this.servers[data[i].hostname] = new Server(data[i], xWithoutShift + areaShift, 10, this.props.theme);
            i++;
            if(i<data.length)
            {
                if(data[i].area != currentArea)
                {
                    areaShift+=150;
                    currentArea = data[i].area;
                    i--;
                    continue;
                }
                this.servers[data[i].hostname] = new Server(data[i], xWithoutShift + areaShift, 70, this.props.theme);
            }
            i++;
            if(i<data.length)
            {
                if(data[i].area != currentArea)
                {
                    areaShift+=150;
                    currentArea = data[i].area;
                    i--;
                    continue;
                }
                this.servers[data[i].hostname] = new Server(data[i], xWithoutShift + areaShift, 130, this.props.theme);
            }
            i++;
            if(i<data.length)
            {
                if(data[i].area != currentArea)
                {
                    areaShift+=150;
                    currentArea = data[i].area;
                    i--;
                    continue;
                }
                this.servers[data[i].hostname] = new Server(data[i], xWithoutShift + areaShift, 190, this.props.theme);
            }
        }
        /*eslint-enable */
        this.mouse = {
            x: this.x+1,
            y: this.y
        };
        this.updateCanvas();
    }

    recreateServers() {
        this.servers = {};
        if(!this.props.data)
            return;
        this.numOfAddedServers = 0;
        let data = this.props.data.sort((a,b) => (a.area > b.area) ? 1 : ((b.area > a.area) ? -1 : 0)); 
        let currentArea = (data && data.length > 0)? data[0].area: "area";
        let areaShift = 0;
        /*eslint-disable */
        for(let i=0; i<data.length; i++) {
            const xWithoutShift = 10+60*Math.floor(i/4);
            if(data[i].area != currentArea)
            {
                areaShift+=100;
                currentArea = data[i].area;
                i--;
                continue;
            }
            this.servers[data[i].hostname] = new Server(data[i], xWithoutShift + areaShift, 10, this.props.theme);
            i++;
            if(i<data.length)
            {
                if(data[i].area != currentArea)
                {
                    areaShift+=150;
                    currentArea = data[i].area;
                    i--;
                    continue;
                }
                this.servers[data[i].hostname] = new Server(data[i], xWithoutShift + areaShift, 70, this.props.theme);
            }
            i++;
            if(i<data.length)
            {
                if(data[i].area != currentArea)
                {
                    areaShift+=150;
                    currentArea = data[i].area;
                    i--;
                    continue;
                }
                this.servers[data[i].hostname] = new Server(data[i], xWithoutShift + areaShift, 130, this.props.theme);
            }
            i++;
            if(i<data.length)
            {
                if(data[i].area != currentArea)
                {
                    areaShift+=150;
                    currentArea = data[i].area;
                    i--;
                    continue;
                }
                this.servers[data[i].hostname] = new Server(data[i], xWithoutShift + areaShift, 190, this.props.theme);
            }
        }
    }

    updateData(obj) 
    {
        if(this.servers[obj.hostname])
        {
            this.servers[obj.hostname].area = obj.area;
            this.servers[obj.hostname].version = obj.version;
            this.servers[obj.hostname].uptime = obj.uptime;
        }
    }

    deleteServer(hostname)
    {
        if(this.servers[hostname])
            delete this.servers[hostname];
    }

    addServer(obj)
    {
        this.servers[obj.hostname] = new Server(obj, 10+60*this.numOfAddedServers, 250, this.props.theme);
        this.numOfAddedServers++;
    }

    updateCanvas() {
        this.ctx.clearRect(0, 0, this.canvasRect.width, this.canvasRect.height);
        let minServer = -1;
        let minDistance = Number.MAX_SAFE_INTEGER;
        const window = {
            left: this.player.x - this.refs.canvas.innerWidth/2.0,
            right: this.player.x + this.refs.canvas.innerWidth/2.0,
            top: this.player.y - this.refs.canvas.innerHeight/2.0,
            bottom: this.player.y + this.refs.canvas.innerHeight/2.0,
        }
        for(let server of Object.values(this.servers))
        {
            if(server.theme !== this.props.theme)
                server.theme = this.props.theme;
            if(this.player.attacking)
            {
                if(intersectRect(this.player.getPunchingHand(), server.getRect()))
                    server.health-=2;
            }
            if(server.health < 0)
            {
                this.props.destroyedServer(server);
            }
            if(intersectRect(window, server.getRect()))
                server.draw(this.ctx);
            if(Math.sqrt(Math.pow(server.x + server.width/2 - this.player.x, 2) + Math.pow(server.y + server.height/2 - this.player.y, 2)) < minDistance)
            {
                minServer = server;
                minDistance = Math.sqrt(Math.pow(server.x + server.width/2 - this.player.x, 2) + Math.pow(server.y + server.height/2 - this.player.y, 2));
            }
        }
        if(this.healing && minServer.health < 96)
            minServer.health+=5;
        if(this.healing && minServer.health < 100 && minServer.health > 95)
            minServer.health++;

        if(!this.healing && minServer.health < 50)
        {
            this.ctx.fillStyle=(this.props.theme === "light")? "black" : "white";
            this.ctx.font = "20px Arial";
            this.ctx.fillText("FIX NEAREST SERVER WITH F", 10, 30);
        }

         // eslint-disable-next-line
        if(minServer.area != this.currentArea)
        {
            this.currentArea = minServer.area;
            let makeRandColor = () => {
                let num = Math.floor(Math.random()*8);
                if(num === this.bgColorIndex)
                    return makeRandColor();
                else {
                    this.bgColorIndex = num;
                    this.updateBgColor();
                }
            }
            makeRandColor();
        }

        this.player.draw(this.ctx);
        requestAnimationFrame(this.updateCanvas);
    }

    updateBgColor() {
        this.refs.canvas.style.backgroundColor = this.colors[this.props.theme][this.bgColorIndex];
    }

    render() {
        return(
            <canvas 
                ref="canvas"
                onMouseMove={
                    e => {
                        this.mouse = {
                            x: e.clientX - this.canvasRect.x,
                            y: e.clientY - this.canvasRect.y
                        }
                        this.player.updateAngle(this.mouse);
                    }
                }
                width={this.props.width}
                height={this.props.height}
                id="canvas"
                style={{  
                    backgroundColor: this.props.backgroundColor,
                    transition: "background-color 2s"
                }}/>
        );
    }
}

class App extends Component {
    constructor(props) {
        super(props);

        this.checkOrientation = this.checkOrientation.bind(this);
        this.createGraphData = this.createGraphData.bind(this);
        this.destroyedServer = this.destroyedServer.bind(this);

        for(let i in data)
        {
            data[i].uptime = (data[i].uptime && !isNaN(parseInt(data[i].uptime)))? parseInt(data[i].uptime) : 0;
        }

        this.state = {
            columnDefs: [
                {headerName: "Hostname", field: "hostname", checkboxSelection: true},
                {headerName: "Area", field: "area", editable: true},
                {headerName: "Version", field: "version", editable: true},
                {headerName: "Uptime", field: "uptime", editable: true}
            ],
            data: data,
            rows: null,
            orientation: "h",
            graph_revision: 0,
            authenticated: 0,
            curUser: null,
            accessCode: "",
            fieldEditerIsOpen: false,
            fieldRemoverIsOpen: false,
            dataEditorIsOpen: false,
            dataRemoverIsOpen: false,
            selectorIsOpen: false,
            shareCodeIsOpen: false,
            joinCodeIsOpen: false,
            bestViewerIsOpen: false,
            dataFileEditorIsOpen: false,
            error: "",
            selectorTab: "hostname",
            cachedExpression: "",
            dataIndex: -1,
            theme: "dark",
            beautify: false,
            pieChart: false,
            layout: {title: 'Details Depending on Area', plot_bgcolor: '#222222', paper_bgcolor: '#222222', font: { family: 'Courier New, monospace', color: "#ffffff"} }
        };

        /*eslint-disable */
        window.addEventListener("keydown", e => {
            if(document.activeElement.tagName === "BODY")
            {
                switch(e.keyCode)
                {
                    case 37:
                    case 65:
                        this.refs.canvasComponent.player.controller.left = true;
                        break;
                    case 38:
                    case 87:
                        this.refs.canvasComponent.player.controller.forward = true;
                        break;
                    case 39:
                    case 68:
                        this.refs.canvasComponent.player.controller.right = true;
                        break;
                    case 40:
                    case 83:
                        this.refs.canvasComponent.player.controller.back = true;
                        break;
                    case 70:
                        this.refs.canvasComponent.healing = true;
                        break;
                    default:
                        break;
                }
            }
        });

        window.addEventListener("keyup", e => {
            if(document.activeElement.tagName === "BODY")
            {
                switch(e.keyCode)
                {
                    case 37:
                    case 65:
                        this.refs.canvasComponent.player.controller.left = false;
                        break;
                    case 38:
                    case 87:
                        this.refs.canvasComponent.player.controller.forward = false;
                        break;
                    case 39:
                    case 68:
                        this.refs.canvasComponent.player.controller.right = false;
                        break;
                    case 40:
                    case 83:
                        this.refs.canvasComponent.player.controller.back = false;
                        break;
                    case 32:
                        this.refs.canvasComponent.player.controller.left = false;
                        this.refs.canvasComponent.player.controller.right = false;
                        this.refs.canvasComponent.player.controller.forward = false;
                        this.refs.canvasComponent.player.controller.back = false;
                        this.refs.canvasComponent.healing = false;
                        break;
                    case 70:
                        this.refs.canvasComponent.healing = false;
                        break;
                    default:
                        break;
                }
            }
        });
        /*eslint-enable */
        window.addEventListener("click", e => {
            if(document.activeElement.tagName === "BODY")
                this.refs.canvasComponent.player.attack();
        });
    }

    componentDidMount() {
        this.checkOrientation();
        window.addEventListener("resize", this.checkOrientation);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.checkOrientation);
    }

    checkOrientation() {
        if(window.innerHeight > window.innerWidth)
            this.setState({orientation: "v"});
        else
            this.setState({orientation: "h"});
    }

    getIndexByHostname(hostname) {
        if(!this.state.data) return -1;
        for(let i = 0; i < this.state.data.length; i++)
            if(hostname === this.state.data[i].hostname)
                return i;
        return -1;
    }

    createGraphData(data) {
        if(!data) return null;
        let xs = [];
        let ys = [];
        let ys2 = [];
        for(let server of data)
        {
            if(server.area)
                if(!xs.includes(server.area))
                {
                    xs.push(server.area);
                    ys[xs.indexOf(server.area)] = 1;
                    ys2[xs.indexOf(server.area)] = (isNaN(parseInt(server.uptime)))? 0 : parseInt(server.uptime);
                }
                else
                {
                    ys2[xs.indexOf(server.area)] += (isNaN(parseInt(server.uptime)))? 0 : parseInt(server.uptime);
                    ys[xs.indexOf(server.area)]++;
                }
        }
        for(let i = 0; i < ys.length; i++)
        {
            ys2[i] /= ys[i];
        }
        for(let i = 1; i < ys.length; i++)
            for(let j = 0; j < i; j++) {
                if(ys[i] > ys[j]) {
                    let tempX = xs.splice(i, 1)[0];
                    let tempY = ys.splice(i, 1)[0];
                    let tempY2 = ys2.splice(i, 1)[0];
                    xs.splice(j,0,tempX);
                    ys.splice(j,0,tempY);
                    ys2.splice(j,0,tempY2);
                }
            }
        
        if(this.state.pieChart)
            return [{type: "pie", labels: xs, values: ys}];

        return [{type: "bar", x: xs, y: ys2, name: "Average Uptime", marker:{color:"blue"}},
                {type: "bar", x: xs, y: ys, name: "Count", marker:{color:"red"}}];

    }

    destroyedServer(s) {
        let dataCopy = (this.state.data)? [...this.state.data]: [];
        let hostname = s.hostname;
        if(this.getIndexByHostname(hostname) >= 0)
        {
            dataCopy.splice(this.getIndexByHostname(hostname), 1);
            this.refs.canvasComponent.deleteServer(hostname);
        }
        this.setState({ data: dataCopy, graph_revision: this.state.graph_revision + 1 });
    }

    render() {
        return (this.state.orientation === "h" && !navigator.userAgent.match(/iphone|android|blackberry/ig))? (
            <>
                <Navbar color={this.state.theme} light={this.state.theme === "light"} dark={this.state.theme === "dark"} expand>
                    <NavbarBrand style={{ cursor: "default", fontSize: "30px", userSelect: "none", color: "red" }}>Server Data</NavbarBrand>
                    <Nav className="ml-auto" navbar
                        style={{
                            fontSize: "15px",
                            userSelect: "none"
                        }}
                        >
                        <UncontrolledDropdown nav inNavbar>
                            <DropdownToggle nav caret>Field</DropdownToggle>
                            <DropdownMenu style={{fontSize: "13px"}}>
                                <DropdownItem onClick={() => {
                                    this.setState({ fieldEditerIsOpen: true });
                                }}>
                                    Edit
                                </DropdownItem>
                                <DropdownItem onClick={() => {
                                    this.setState({ fieldRemoverIsOpen: true });
                                }}>
                                    Remove
                                </DropdownItem>
                                <DropdownItem onClick={() => {
                                    this.setState({ bestViewerIsOpen: true });
                                }}>
                                    Performance
                                </DropdownItem>
                            </DropdownMenu>
                        </UncontrolledDropdown>
                        <UncontrolledDropdown nav inNavbar>
                            <DropdownToggle nav caret>Data</DropdownToggle>
                            <DropdownMenu style={{fontSize: "13px"}}>
                                <DropdownItem onClick={() => {
                                    this.setState({ dataEditorIsOpen: true, dataIndex: -1 });
                                }}>
                                    New Server
                                </DropdownItem>
                                <DropdownItem onClick={() => {
                                    this.setState({ dataRemoverIsOpen: true });
                                }}>
                                    Remove Server
                                </DropdownItem>
                                <DropdownItem onClick={() => {
                                    this.setState({ dataEditorIsOpen: true });
                                }}>
                                    Edit Selected
                                </DropdownItem>
                                <DropdownItem onClick={() => {
                                    let dataCopy = (this.state.data)? [...this.state.data]: [];
                                    let selectedData = this.gridApi.getSelectedRows();

                                    for(let d of selectedData)
                                    {
                                        this.refs.canvasComponent.deleteServer(d.hostname);
                                        dataCopy.splice(dataCopy.indexOf(d), 1);
                                    }

                                    this.setState({ data: dataCopy });
                                }}>
                                    Remove Selected
                                </DropdownItem>
                                <DropdownItem onClick={() => {
                                    this.setState({ dataFileEditorIsOpen: true });
                                }}>
                                    Edit File
                                </DropdownItem>
                            </DropdownMenu>
                        </UncontrolledDropdown>
                        <UncontrolledDropdown nav inNavbar>
                            <DropdownToggle nav caret>Graph</DropdownToggle>
                            <DropdownMenu style={{fontSize: "13px"}}>
                                <DropdownItem onClick={() => {
                                    this.setState({ pieChart: false, graph_revision: this.state.graph_revision + 1 });
                                }}>
                                    Bar Graph
                                </DropdownItem>
                                <DropdownItem onClick={() => {
                                    this.setState({ pieChart: true, graph_revision: this.state.graph_revision + 1 });
                                }}>
                                    Pie Chart
                                </DropdownItem>
                            </DropdownMenu>
                        </UncontrolledDropdown>
                        <UncontrolledDropdown nav inNavbar style={{ borderRight: "1px solid red" }}>
                            <DropdownToggle nav caret>Select</DropdownToggle>
                            <DropdownMenu style={{fontSize: "13px"}}>
                                <DropdownItem onClick={() => {
                                        this.setState({ selectorIsOpen: true });
                                    }}>
                                    Open Selector
                                </DropdownItem>
                                <DropdownItem onClick={() => {
                                    this.gridApi.deselectAll();
                                }}>
                                    Deselect All
                                </DropdownItem>
                                <DropdownItem disabled>
                                    {
                                        (() => {
                                            if(this.gridApi)
                                                return this.gridApi.getSelectedRows().length+" Rows Selected";
                                            return "0 Rows Selected"
                                        })()
                                    }
                                </DropdownItem>
                            </DropdownMenu>
                        </UncontrolledDropdown>
                        <NavItem>
                            <NavLink className="nav-link" onClick={() => {
                                if(this.state.authenticated === 1)
                                {
                                    firebase.database().ref('/'+this.state.accessCode).once("value", snapshot => {
                                        this.setState({ data: snapshot.val(), graph_revision: this.state.graph_revision + 1 });
                                        this.refs.canvasComponent.recreateServers();
                                    });
                                }
                                else
                                    this.setState({ error: "Sign In To Pull Data" });
                                
                            }}>Pull</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink className="nav-link" onClick={() => {
                                if(this.state.authenticated === 1)
                                {
                                    firebase.database().ref("/"+this.state.curUser.uid).once("value", snap => {
                                        firebase.database().ref('/'+snap.val()).set(this.state.data);
                                    });
                                }
                                else
                                this.setState({ error: "Sign In Push Data" });
                            

                                }}>Push</NavLink>
                        </NavItem>
                        <UncontrolledDropdown nav inNavbar style={{ borderRight: "1px solid red" }}>
                            <DropdownToggle nav caret>Share</DropdownToggle>
                            <DropdownMenu style={{fontSize: "13px"}}>
                                <DropdownItem onClick={() => {
                                        this.setState({ shareCodeIsOpen: true });
                                    }}>
                                    Share
                                </DropdownItem>
                                <DropdownItem onClick={() => {
                                    this.setState({ joinCodeIsOpen: true });
                                }}>
                                    Join 
                                </DropdownItem>
                            </DropdownMenu>
                        </UncontrolledDropdown>
                        <UncontrolledDropdown nav inNavbar>
                            <DropdownToggle nav caret>Import</DropdownToggle>
                            <DropdownMenu style={{fontSize: "13px"}}>
                                <DropdownItem onClick={() => {
                                    let fileSelector = document.createElement("input");
                                    fileSelector.setAttribute("type", "file");
                                    fileSelector.setAttribute("accept", ".json");
                                    fileSelector.onchange = event => {
                                        let fileReader = new FileReader();
                                        fileReader.onload = e => {
                                            try {
                                                let data = JSON.parse(e.target.result);
                                                for(let i in data)
                                                {
                                                    data[i].uptime = (data[i].uptime && !isNaN(parseInt(data[i].uptime)))? parseInt(data[i].uptime) : 0;
                                                }
                                                this.setState({ data: data, graph_revision: this.state.graph_revision + 1 }, () => this.refs.canvasComponent.recreateServers());
                                            } catch(e) {
                                                this.setState({ error: "Error in JSON file: "+e.message });
                                            }
                                        }
                                        fileReader.readAsText(fileSelector.files[0]);
                                    };
                                    document.body.appendChild(fileSelector);
                                    fileSelector.click();
                                    document.body.removeChild(fileSelector);
                                }}>
                                    JSON
                                </DropdownItem>
                                <DropdownItem onClick={() => {
                                    let fileSelector = document.createElement("input");
                                    fileSelector.setAttribute("type", "file");
                                    fileSelector.setAttribute("accept", ".csv");
                                    fileSelector.onchange = event => {
                                        let fileReader = new FileReader();
                                        fileReader.onload = e => {
                                            let fileContents = e.target.result;
                                            csv.parse(fileContents.replace(/"/g, ""), (err, csvData) => {
                                                if(csvData.length < 1)
                                                    err = "Csv file not properly formatted";
                                                if(err)
                                                {
                                                    this.setState({ error: "Error in CSV file: "+err });
                                                    return;
                                                }
                                                let jsonData = [];
                                                let keys = [];
                                                for(let i = 0; i < csvData[0].length; i++)
                                                {
                                                    keys.push(csvData[0][i].replace(/[^0-9a-z]/gi, '').toLowerCase());
                                                }
                                                for(let i = 1; i < csvData.length; i++)
                                                {
                                                    let obj = {};
                                                    for(let j = 0; j < keys.length; j++)
                                                    {
                                                        obj[keys[j]] = csvData[i][j]; 
                                                    }
                                                    jsonData.push(obj);
                                                }
                                                for(let i in jsonData)
                                                {
                                                    jsonData[i].uptime = (jsonData[i].uptime && !isNaN(parseInt(jsonData[i].uptime)))? parseInt(jsonData[i].uptime) : 0;
                                                }
                                                this.setState({ data: jsonData, graph_revision: this.state.graph_revision + 1 }, () => this.refs.canvasComponent.recreateServers());
                                            });
                                            
                                        }
                                        fileReader.readAsBinaryString(fileSelector.files[0]);
                                    };
                                    document.body.appendChild(fileSelector);
                                    fileSelector.click();
                                    document.body.removeChild(fileSelector);
                                }}>
                                    CSV
                                </DropdownItem>
                            </DropdownMenu>
                        </UncontrolledDropdown>
                        <UncontrolledDropdown nav inNavbar style={{ borderRight: "1px solid red" }}>
                            <DropdownToggle nav caret>Export</DropdownToggle>
                            <DropdownMenu style={{fontSize: "13px"}}>
                                <DropdownItem onClick={() => {
                                    let e = document.createElement('a');
                                    let blob = new Blob([JSON.stringify(this.state.data, null, (this.state.beautify)? 4: 0)], {type: "text/json;charset=utf-8"});
                                    let url = URL.createObjectURL(blob);
                                    e.setAttribute('href', url);
                                    e.setAttribute("download", "ServerData.json");
                                    e.style.display = 'none';
                                    document.body.appendChild(e);
                                    e.click();
                                    document.body.removeChild(e);
                                }}>
                                    JSON
                                </DropdownItem>
                                <DropdownItem onClick={() => {
                                    this.gridApi.exportDataAsCsv({fileName: "ServerData.csv"});
                                }}>
                                    CSV
                                </DropdownItem>
                                <DropdownItem onClick={() => {
                                    this.refs.plot.el.getElementsByClassName('modebar')[0].getElementsByClassName('modebar-btn')[0].click();
                                }}>
                                    Graph
                                </DropdownItem>
                                <DropdownItem onClick={() => {
                                    let e = document.createElement('a');
                                    let url = document.getElementById('canvas').toDataURL('image/png');
                                    e.setAttribute('href', url);
                                    e.setAttribute("download", "canvas.png");
                                    e.style.display = 'none';
                                    document.body.appendChild(e);
                                    e.click();
                                    document.body.removeChild(e);
                                }}>
                                    Canvas
                                </DropdownItem>
                            </DropdownMenu>
                        </UncontrolledDropdown>
                        <NavItem>
                            <NavLink className="nav-link" style={{ borderRight: "1px solid red" }} onClick={() => {
                                this.gridApi.refreshCells();
                                this.refs.canvasComponent.recreateServers();
                                this.setState({ graph_revision: this.state.graph_revision + 1 });
                            }}>Refresh</NavLink>
                        </NavItem>
                        <UncontrolledDropdown nav inNavbar style={{
                            marginRight: 30,
                            width: 75
                        }}>
                            <DropdownToggle nav caret>User</DropdownToggle>
                            <DropdownMenu style={{fontSize: "15px", overflow: "hidden", width: 160, textAlign: "center", margin: 0, padding: 0}}>
                                {
                                    (() => {
                                        if(this.state.authenticated === 0)
                                            return (
                                                <DropdownItem onClick={() => {
                                                        const provider = new firebase.auth.GoogleAuthProvider();
                                                        firebase.auth().signInWithPopup(provider).then(result => {
                                                            this.setState({ curUser: result.user, authenticated: 1 });
                                                            firebase.database().ref("/"+this.state.curUser.uid).once("value", snap => {
                                                                if(!snap.val())
                                                                {
                                                                    let r = Math.random().toString(36).substring(2);
                                                                    firebase.database().ref("/"+this.state.curUser.uid).set(r);
                                                                    firebase.database().ref("/"+r).set(this.state.data);
                                                                    this.setState({ accessCode: r });
                                                                    firebase.database().ref("/"+this.state.curUser.uid).on("value", snap => {
                                                                        this.setState({ accessCode: snap.val() });
                                                                    });
                                                                }
                                                                else
                                                                {
                                                                    firebase.database().ref('/'+snap.val()).once("value", snapshot => {
                                                                        this.setState({ data: snapshot.val(), graph_revision: this.state.graph_revision + 1 });
                                                                        this.refs.canvasComponent.recreateServers();
                                                                    });
                                                                    firebase.database().ref("/"+this.state.curUser.uid).on("value", snap => {
                                                                        this.setState({ accessCode: snap.val() });
                                                                    });
                                                                }
                                                            });
                                                        }).catch(err => {
                                                            
                                                        });
                                                    }}>
                                                    Sign In
                                                </DropdownItem>
                                            );
                                            else 
                                                return (
                                                    <>
                                                        <img src={this.state.curUser.photoURL} alt="USER" style={{ 
                                                            borderRadius: 100,
                                                            width: 50,
                                                            height: 50,
                                                            display: "block",
                                                            margin: "auto"
                                                         }} />
                                                        <DropdownItem disabled>
                                                            {this.state.curUser.displayName}
                                                        </DropdownItem>
                                                        <DropdownItem disabled>
                                                            {this.state.curUser.email}
                                                        </DropdownItem>
                                                        <DropdownItem onClick={() => {
                                                            firebase.auth().signOut();
                                                            this.setState({ curUser: null, authenticated: 0, accessCode: null });
                                                        }}>
                                                            Sign Out
                                                        </DropdownItem>
                                                    </>
                                                );
                                    })()
                                }
                            </DropdownMenu>
                        </UncontrolledDropdown>
                        <Toggle name="toggle-theme" checked={this.state.theme === "light"} onToggle={(checked, event) => {
                            let layoutCopy = {...this.state.layout};
                            layoutCopy.plot_bgcolor = checked? "#ffffff" : "#222222";
                            layoutCopy.paper_bgcolor = checked? "#ffffff" : "#222222";
                            layoutCopy.font.color = checked? "#000000" : "#ffffff";
                            this.setState({ theme: checked? "light" : "dark", layout: layoutCopy, graph_revision: this.state.graph_revision + 1 }, () => this.refs.canvasComponent.updateBgColor());
                        }}/>
                    </Nav>
                </Navbar>
                <div
                    style={{
                        width: "100vw",
                        height: window.innerHeight - 62,
                        position: "absolute",
                        bottom: 0,
                        left: 0
                    }}
                >
                    <div 
                        className={`ag-theme-${(this.state.theme === "dark")? "dark": "balham"} ag-grid`}
                        style={{ 
                            width: '60vw',
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            top: 0
                        }}
                        >
                        <AgGridReact
                            enableSorting={true}
                            enableFilter={true}
                            rowSelection="multiple"
                            rowDragManaged={true}
                            columnDefs={this.state.columnDefs}
                            rowData={this.state.data}
                            animateRows={true}
                            enableCellChangeFlash={true}
                            getRowNodeId={ data => data.hostname }
                            onGridReady={
                                params => {
                                    this.gridApi = params.api;
                                    this.columnApi = params.columnApi;
                                }
                            }
                            onRowSelected={
                                e => {
                                    let shouldRun = false;
                                    let selectedData = this.gridApi.getSelectedRows();
                                    for(let d of selectedData)
                                    {
                                        if(d.hostname === e.data.hostname)
                                            shouldRun = true;
                                    }
                                    if(shouldRun)
                                    {
                                        // eslint-disable-next-line
                                        this.refs.canvasComponent.player.x = this.refs.canvasComponent.servers[e.data.hostname].x + this.refs.canvasComponent.servers[e.data.hostname].width/2;
                                        // eslint-disable-next-line
                                        this.refs.canvasComponent.player.y = this.refs.canvasComponent.servers[e.data.hostname].y + this.refs.canvasComponent.servers[e.data.hostname].height/2;
                                        playerX = this.refs.canvasComponent.player.x;
                                        playerY = this.refs.canvasComponent.player.y;
                                        this.setState({ dataIndex: this.getIndexByHostname(e.data.hostname), graph_revision: this.state.graph_revision+1 });
                                    }
                                    else
                                        this.setState({graph_revision: this.state.graph_revision+1});
                                }
                            }
                            onCellEditingStopped={
                                event => {
                                    this.setState({graph_revision:this.state.graph_revision+1});
                                    this.refs.canvasComponent.updateData(event.data);
                                }
                            }
                            >
                        </AgGridReact>
                    </div>
                    <div>
                        <div
                            style={{
                                position: "absolute",
                                width:"40vw",
                                height: (window.innerHeight - 62) / 2.0,
                                bottom: 0,
                                right: 0,
                            }}
                            className="Graph"
                            >
                            <Plot
                                revision={this.state.graph_revision}
                                data={this.createGraphData((this.gridApi && this.gridApi.getSelectedRows().length > 0)? this.gridApi.getSelectedRows() : this.state.data)}
                                responsive={true}
                                style={{ 
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    userSelect: "none"
                                }}
                                ref="plot"
                                layout={ this.state.layout }
                                config={{ scrollZoom: true, displaylogo: false }}
                            />
                        </div>
                        <div
                            style={{
                                position: "absolute",
                                width:"40vw",
                                height:(window.innerHeight - 62) / 2.0,
                                top: 0,
                                right: 0
                            }}
                            className="Canvas"
                            >
                            <Canvas 
                                width={`${0.4*document.documentElement.clientWidth}px`}
                                height={(window.innerHeight - 62) / 2.0}
                                backgroundColor="green"
                                data={this.state.data}
                                ref="canvasComponent"
                                destroyedServer={this.destroyedServer}
                                theme={this.state.theme}
                            />
                        </div>
                    </div>
                </div>

                <Modal size="lg" isOpen={this.state.dataEditorIsOpen}>
                    <ModalHeader>Server Editor</ModalHeader>
                    <Form onSubmit={(e) =>
                    {
                        e.preventDefault();

                        let hostname = document.getElementById("edit_hostname").value;
                        let area = document.getElementById("edit_area").value;
                        let version = document.getElementById("edit_version").value;
                        let uptime = document.getElementById("edit_uptime").value;

                        let obj = {
                            hostname: hostname,
                            area: area,
                            version: version,
                            uptime: uptime
                        }

                        let dataCopy = (this.state.data)? [...this.state.data]: [];
                        if(this.getIndexByHostname(hostname) >= 0)
                            dataCopy[this.getIndexByHostname(hostname)] = obj;
                        else
                        {
                            dataCopy.push(obj);
                            this.refs.canvasComponent.addServer(obj);
                        }
                        this.setState({ data: dataCopy, dataEditorIsOpen: false });
                        this.gridApi.refreshCells();
                    }}>
                        <ModalBody>
                            <FormGroup>
                                <Label>Hostname</Label>
                                <Input type="text" id="edit_hostname" defaultValue={(this.state.dataIndex >= 0 && this.state.data[this.state.dataIndex])? this.state.data[this.state.dataIndex].hostname: ""}></Input>                   
                            </FormGroup>
                            <FormGroup>
                                <Label>Area</Label>
                                <Input type="text" id="edit_area" defaultValue={(this.state.dataIndex >= 0 && this.state.data[this.state.dataIndex])? this.state.data[this.state.dataIndex].area: ""}></Input>                                
                            </FormGroup>
                            <FormGroup>
                                <Label>Version</Label>
                                <Input type="text" id="edit_version" defaultValue={(this.state.dataIndex >= 0 && this.state.data[this.state.dataIndex])? this.state.data[this.state.dataIndex].version: ""}></Input>                                
                            </FormGroup>
                            <FormGroup>
                                <Label>Uptime</Label>
                                <Input type="text" id="edit_uptime" defaultValue={(this.state.dataIndex >= 0 && this.state.data[this.state.dataIndex])? this.state.data[this.state.dataIndex].uptime: ""}></Input>                                
                            </FormGroup>
                        </ModalBody>
                        <ModalFooter>
                            <Button type="reset" color="light" onClick={(e) => { this.setState({ dataEditorIsOpen: false }); }}>Cancel</Button>
                            <Button type="reset" color="dark" onClick={(e) => {
                                let hostname = document.getElementById("edit_hostname").value;
                                let area = document.getElementById("edit_area").value;
                                let version = document.getElementById("edit_version").value;
                                let uptime = document.getElementById("edit_uptime").value;
                                let arr = [area, version, uptime];
                                let count = 0;
                                for(let a of arr)
                                    if(a)
                                        count++;
                                const saveData = () => {

                                    hostname = document.getElementById("edit_hostname").value;
                                    area = document.getElementById("edit_area").value;
                                    version = document.getElementById("edit_version").value;
                                    uptime = document.getElementById("edit_uptime").value;

                                    let obj = {
                                        hostname: hostname,
                                        area: area,
                                        version: version,
                                        uptime: uptime
                                    }
                                    let dataCopy = (this.state.data)? [...this.state.data]: [];
                                    if(this.getIndexByHostname(hostname) >= 0)
                                        dataCopy[this.getIndexByHostname(hostname)] = obj;
                                    else
                                    {
                                        dataCopy.push(obj);
                                        this.refs.canvasComponent.addServer(obj);
                                    }
                                    this.setState({ data: dataCopy});
                                    this.gridApi.refreshCells();
                                };
                                saveData();
                                if(count === 2) {
                                    if(this.state.authenticated === 0)
                                        this.setState({ error: "Sign In To Make Requests to the Server" });
                                    else if(!area)
                                        axios.get(`http://localhost:4000/${this.state.accessCode}?guess=area&version=${version}&uptime=${uptime}`).then(res => {
                                            let d = (typeof res.data != 'object')? JSON.parse(res.data): res.data;                                            
                                            if(!d.error) {
                                                document.getElementById("edit_area").value = d.prediction;
                                                saveData();
                                            }
                                            else
                                                this.setState({ error: res.data.error });
                                        });
                                    else if(!version)
                                        axios.get(`http://localhost:4000/${this.state.accessCode}?guess=version&area=${area}&uptime=${uptime}`).then(res => {
                                            let d = (typeof res.data != 'object')? JSON.parse(res.data): res.data;                                              
                                            if(!d.error) {
                                                document.getElementById("edit_version").value = d.prediction;
                                                saveData();
                                            }
                                            else
                                                this.setState({ error: res.data.error });
                                        });
                                    else if(!uptime)
                                        axios.get(`http://localhost:4000/${this.state.accessCode}?guess=uptime&area=${area}&version=${version}`).then(res => {
                                            let d = (typeof res.data != 'object')? JSON.parse(res.data): res.data;                                            
                                            if(!d.error) {
                                                document.getElementById("edit_uptime").value = d.prediction;
                                                saveData();
                                            }
                                            else
                                                this.setState({ error: res.data.error });
                                        });
                                } else {
                                    this.setState({ error: "Leave one and only one field other than the hostname blank for the server to make a prediction" });
                                }
                            }}>Predict</Button>
                            <Button type="submit" color="primary">Save</Button>
                        </ModalFooter>
                    </Form>
                </Modal>

                <Modal size="lg" isOpen={this.state.dataRemoverIsOpen}>
                    <ModalHeader>Delete Server</ModalHeader>
                    <Form onSubmit={(e) => {
                        e.preventDefault();
                        let dataCopy = (this.state.data)? [...this.state.data]: [];
                        let hostname = document.getElementById("edit_hostname").value;
                        if(this.getIndexByHostname(hostname) >= 0)
                        {
                            dataCopy.splice(this.getIndexByHostname(hostname), 1);
                            this.refs.canvasComponent.deleteServer(hostname);
                        }
                        this.setState({ data: dataCopy, dataRemoverIsOpen: false });
                    }}>
                        <ModalBody>
                            <FormGroup>
                                <Label>Hostname</Label>
                                <Input type="text" id="edit_hostname" defaultValue={(this.state.dataIndex >= 0 && this.state.data[this.state.dataIndex])? this.state.data[this.state.dataIndex].hostname: ""}></Input>                   
                            </FormGroup>
                        </ModalBody>
                        <ModalFooter>
                            <Button type="reset" color="light" onClick={(e) => { this.setState({ dataRemoverIsOpen: false }); }}>Cancel</Button>
                            <Button type="submit" color="danger">Delete</Button>
                        </ModalFooter>
                    </Form>
                </Modal>

                <Modal size="lg" isOpen={this.state.fieldEditerIsOpen}>
                    <ModalHeader>Field Editor</ModalHeader>
                    <Form onSubmit={(e) => {
                        e.preventDefault();
                        let dataCopy = (this.state.data)? [...this.state.data]: [];
                        let hostnames = document.getElementById("edit_hostname").value.replace(/ /g, "").split(",");
                        let key = document.getElementById("edit_key").value.toLowerCase();
                        let value = document.getElementById("edit_value").value;
                        if(key === "hostname")
                            this.setState({ error: "Cannot change hostname" });
                        else
                            for(let hostname of hostnames)
                            {
                                dataCopy[this.getIndexByHostname(hostname)][key] = value;
                                this.refs.canvasComponent.updateData(dataCopy[this.getIndexByHostname(hostname)]);
                            }
                        this.setState({ data: dataCopy, fieldEditerIsOpen: false, graph_revision: this.state.graph_revision + 1 });
                        this.gridApi.refreshCells();
                    }}>
                        <ModalBody>
                            <FormGroup>
                                <Label>Hostname</Label>
                                <Input type="text" id="edit_hostname" defaultValue={(() => {
                                    if(this.gridApi && this.gridApi.getSelectedRows().length > 0)
                                    {
                                        let arr = [];
                                        for(let obj of this.gridApi.getSelectedRows())
                                        {
                                            arr.push(obj.hostname);
                                        }
                                        return arr.join(", ");
                                    }
                                    return "";
                                })()}></Input>                   
                            </FormGroup>
                            <FormGroup>
                                <Label>Field Name</Label>
                                <Input type="text" id="edit_key"></Input>                   
                            </FormGroup>
                            <FormGroup>
                                <Label>Value</Label>
                                <Input type="text" id="edit_value"></Input>                   
                            </FormGroup>
                        </ModalBody>
                        <ModalFooter>
                            <Button type="reset" color="light" onClick={(e) => { this.setState({ fieldEditerIsOpen: false }); }}>Cancel</Button>
                            <Button type="submit" color="dark">Edit</Button>
                        </ModalFooter>
                    </Form>
                </Modal>

                <Modal size="lg" isOpen={this.state.fieldRemoverIsOpen}>
                    <ModalHeader>Field Remover</ModalHeader>
                    <Form onSubmit={(e) => {
                        e.preventDefault();
                        let dataCopy = (this.state.data)? [...this.state.data]: [];
                        let hostnames = document.getElementById("edit_hostname").value.replace(/ /g, "").split(",");
                        let key = document.getElementById("edit_key").value.toLowerCase();
                        if(key === "hostname")
                            this.setState({ error: "Cannot change hostname" });
                        else
                            for(let hostname of hostnames)
                            {
                                dataCopy[this.getIndexByHostname(hostname)][key] = "";
                                this.refs.canvasComponent.updateData(dataCopy[this.getIndexByHostname(hostname)]);
                            }
                        this.setState({ data: dataCopy, fieldRemoverIsOpen: false, graph_revision: this.state.graph_revision + 1 });
                        this.gridApi.refreshCells();
                    }}>
                        <ModalBody>
                            <FormGroup>
                                <Label>Hostname</Label>
                                <Input type="text" id="edit_hostname" defaultValue={(() => {
                                    if(this.gridApi && this.gridApi.getSelectedRows().length > 0)
                                    {
                                        let arr = [];
                                        for(let obj of this.gridApi.getSelectedRows())
                                        {
                                            arr.push(obj.hostname);
                                        }
                                        return arr.join(", ");
                                    }
                                    return "";
                                })()}></Input>                   
                            </FormGroup>
                            <FormGroup>
                                <Label>Field Name</Label>
                                <Input type="text" id="edit_key"></Input>                   
                            </FormGroup>
                        </ModalBody>
                        <ModalFooter>
                            <Button type="reset" color="light" onClick={(e) => { this.setState({ fieldRemoverIsOpen: false }); }}>Cancel</Button>
                            <Button type="submit" color="danger">Remove</Button>
                        </ModalFooter>
                    </Form>
                </Modal>

                <Modal size="lg" isOpen={this.state.selectorIsOpen}>
                    <ModalHeader>Selector</ModalHeader>
                    <Form onSubmit={(e) => {
                        e.preventDefault();
                        this.gridApi.deselectAll();
                        if(this.state.selectorTab === "hostname")
                        {
                            let hostnames = document.getElementById("edit_hostname").value.replace(/ /g, "").split(",");
                            this.gridApi.forEachNode(
                                node => {
                                    if(hostnames.includes(node.data.hostname))
                                    {
                                        node.setSelected(true);
                                    }
                                }
                            );
                        }
                        else
                        {
                            let expression = document.getElementById("edit_expression").value;
                            try {
                                this.gridApi.forEachNode(
                                    node => {
                                        let replacedExpression = expression.replace(/{hostname}/g, '"'+node.data.hostname+'"').replace(/{area}/g, '"'+node.data.area+'"').replace(/{version}/g, node.data.version).replace(/{uptime}/g, '"'+node.data.uptime+'"');
                                        // eslint-disable-next-line
                                        if(eval(replacedExpression))
                                        {
                                            node.setSelected(true);
                                        }
                                    }    
                                );
                            }
                            catch(e) {
                                this.setState({ error: "Error in Boolean Expression: "+e.message });
                            }
                            this.setState({cachedExpression: expression});
                        }
                        this.setState({ selectorIsOpen: false });
                    }}>
                        <ModalBody>
                            <Nav tabs>
                                <NavItem>
                                    <NavLink onClick={() => { this.setState({ selectorTab: "hostname" }) }}>By Hostname</NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink onClick={() => { this.setState({ selectorTab: "expression" }) }}>By Expression</NavLink>
                                </NavItem>
                            </Nav>
                            <TabContent activeTab={this.state.selectorTab}>
                                <TabPane tabId="hostname">
                                    <FormGroup>
                                        <Label>Hostname</Label>
                                        <Input type="text" id="edit_hostname" defaultValue={(() => {
                                            if(this.gridApi && this.gridApi.getSelectedRows().length > 0)
                                            {
                                                let arr = [];
                                                for(let obj of this.gridApi.getSelectedRows())
                                                {
                                                    arr.push(obj.hostname);
                                                }
                                                return arr.join(", ");
                                            }
                                            return "";
                                        })()}></Input>                   
                                    </FormGroup>
                                </TabPane>
                                <TabPane tabId="expression">
                                    <FormGroup>
                                        <Label>Expression</Label>
                                        <FormText>Put a boolean here that will be evaluated to determine which nodes to select. Use variables like {"{"}hostname{"}"}, {"{"}area{"}"}, {"{"}version{"}"}, and {"{"}uptime{"}"} to access the respective values.<br /><span style={{color: "red", fontWeight: "bold", fontStyle: "underline"}}>WARNING</span>: Selecting too many items may cause the page to lag or crash <br /> Examples: <br />{"{"}area{"}"} == '1' <br /> {"{"}uptime{"} <"} 10</FormText>
                                        <Input type="text" id="edit_expression" defaultValue={(() => {
                                            if(this.state.cachedExpression)
                                            {
                                                return this.state.cachedExpression;
                                            }
                                            if(this.gridApi && this.gridApi.getSelectedRows().length > 0)
                                            {
                                                let arr = [];
                                                for(let obj of this.gridApi.getSelectedRows())
                                                {
                                                    arr.push(obj.hostname);
                                                }
                                                return "['"+arr.join("', '")+"'].includes({hostname})";
                                            }
                                            return "";
                                        })()}></Input>                   
                                    </FormGroup>
                                </TabPane>
                            </TabContent>
                            
                        </ModalBody>
                        <ModalFooter>
                            <Button type="reset" color="light" onClick={(e) => { this.setState({ selectorIsOpen: false }); }}>Cancel</Button>
                            <Button type="submit" color="primary">Select</Button>
                        </ModalFooter>
                    </Form>
                </Modal>

                <Modal size="lg" isOpen={this.state.joinCodeIsOpen}>
                    <ModalHeader>Join Code</ModalHeader>
                    <Form onSubmit={(e) => {
                        e.preventDefault();
                        if(this.state.authenticated === 1)
                        {
                            let code = document.getElementById("edit_code").value;
                            firebase.database().ref("/"+this.state.curUser.uid).set(code);
                            this.setState({ joinCodeIsOpen: false });
                            firebase.database().ref("/"+this.state.curUser.uid).once("value", snap => {
                                firebase.database().ref('/'+snap.val()).once("value", snapshot => {
                                    this.setState({ data: snapshot.val(), graph_revision: this.state.graph_revision + 1 });
                                    this.refs.canvasComponent.recreateServers();
                                });
                            });
                        }
                        else
                            this.setState({ error: "Sign In To Join" });
                    }}>
                        <ModalBody>
                            <FormGroup>
                                <Label>Code</Label>
                                <FormText>Enter the code from another account (find the code in Share > Share) or create a new code to start a new data room</FormText>
                                <Input type="text" id="edit_code" />                   
                            </FormGroup>
                        </ModalBody>
                        <ModalFooter>
                            <Button type="reset" color="light" onClick={(e) => { this.setState({ joinCodeIsOpen: false }); }}>Cancel</Button>
                            <Button type="submit" color="primary">Join</Button>
                        </ModalFooter>
                    </Form>
                </Modal>

                <Modal size="lg" isOpen={this.state.shareCodeIsOpen}>
                    <ModalHeader>Share Code</ModalHeader>
                    <ModalBody>
                        <FormText>Share this code to anyone who wants to share and edit the same data as you. </FormText>
                        {(() => {
                            if(this.state.authenticated === 1)
                                return this.state.accessCode;
                            else 
                                return "Please Sign In To Share";
                        })()}
                    </ModalBody>
                    <ModalFooter>
                        <Button type="submit" color="primary" onClick={(e) => { this.setState({ shareCodeIsOpen: false }); }}>Ok</Button>
                    </ModalFooter>
                </Modal>

                <Modal size="lg" isOpen={this.state.dataFileEditorIsOpen}>
                    <ModalHeader>Edit File</ModalHeader>
                    <Form onSubmit={(e) => {
                        e.preventDefault();
                        try {
                            let newData = JSON.parse(document.getElementById("edit_data").value);

                            for(let i in newData)
                            {
                                newData[i].uptime = (newData[i].uptime && !isNaN(parseInt(newData[i].uptime)))? parseInt(newData[i].uptime) : 0;
                            }
                            
                            this.setState({ data: newData, dataFileEditorIsOpen: false });
                        } catch(e) {
                            this.setState({ error: `Error in saving data: `+e.message});
                        }
                    }}>
                        <ModalBody>
                            <FormGroup>
                                <Label>Data</Label>
                                <Input type="textarea" id="edit_data" rows="10" defaultValue={JSON.stringify(this.state.data, null, (this.state.beautify)? 4: 0)}/>
                                <Toggle name="toggle-minify" label="Minify" labelRight="Beautify" style={{float:"right"}} checked={this.state.beautify} onToggle={(checked, event) => { 
                                    try {
                                        document.getElementById('edit_data').value = JSON.stringify(JSON.parse(document.getElementById('edit_data').value), null, (checked)? 4: 0);                             
                                        this.setState({beautify: checked}); 
                                    } catch(e) {
                                        this.setState({ error: `Error in ${checked? 'beatifying': 'minifying'} data: `+e.message});
                                    }
                                }}/>
                            </FormGroup>
                        </ModalBody>
                        <ModalFooter>
                            <Button type="reset" color="light" onClick={(e) => { this.setState({ dataFileEditorIsOpen: false }); }}>Cancel</Button>
                            <Button type="reset" color="secondary" onClick={e => {
                                document.getElementById('edit_data').value = JSON.stringify(this.state.data, null, (this.state.beautify)? 4: 0);
                            }}>Reset</Button>
                            <Button type="submit" color="primary">Save</Button>
                        </ModalFooter>
                    </Form>
                </Modal>
                
                <Modal size="lg" isOpen={!!this.state.error}>
                    <ModalHeader style={{ color: "red" }}>Error</ModalHeader>
                    <ModalBody>
                        {this.state.error}
                    </ModalBody>
                    <ModalFooter>
                        <Button type="submit" color="secondary" onClick={(e) => { this.setState({ error: null }); }}>Close</Button>
                    </ModalFooter>
                </Modal>

                <Modal size="lg" isOpen={this.state.bestViewerIsOpen}>
                    <ModalHeader>Performance</ModalHeader>
                    <ModalBody>
                        <FormText>Enter in an attribute and get the best performing values for that attribute</FormText>
                        <Input type="text" id="input-text" />
                        <Table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Value</th>
                                    <th>Count</th>
                                    <th>Average Uptime</th>
                                </tr>
                            </thead>
                            <tbody id="tbody">
                                {this.state.rows}
                            </tbody>
                        </Table>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={(e) => { this.setState({ bestViewerIsOpen: false }); }}>Close</Button>
                        <Button color="primary" onClick={(e) => {
                                    let rows = [];
                                    if(this.state.authenticated === 0)
                                        this.setState({ error: "Sign In To Make Requests to the Server" });
                                    else
                                        axios.get(`http://localhost:4000/${this.state.accessCode}?best=${document.getElementById("input-text").value.toLowerCase()}`).then(res => {
                                        console.log(res.data);    
                                        let d = (typeof res.data === 'object')? res.data: JSON.parse(res.data);
                                            if(!d.error) {
                                                for(let i = 0; i < d.best.length; i++)
                                                    rows.push(<tr key={i+1}>
                                                        <th scope="row">{i+1}</th>
                                                        <td>{d.best[i][0]}</td>
                                                        <td>{d.best[i][1]}</td>
                                                        <td>{d.best[i][2]}</td>
                                                    </tr>);
                                            }
                                            else
                                                this.setState({ error: d.error });
                                            this.setState({ rows: rows })
                                        });
                                }}>Load</Button>
                    </ModalFooter>
                </Modal>

                

            </>
        ) : (
            <div 
                    className="ag-theme-dark ag-grid"
                    style={{ 
                        height: '100vh', 
                        width: '100vw' 
                    }}
                    >
                    <AgGridReact
                        enableSorting={true}
                        enableFilter={true}
                        rowSelection="multiple"
                        rowDragManaged={true}
                        columnDefs={this.state.columnDefs}
                        rowData={this.state.data}
                        onGridReady={
                            params => {
                                this.gridApi = params.api;
                                this.columnApi = params.columnApi;
                            }
                        }>
                    </AgGridReact>
                </div>
        );
    }
}

export default App;
