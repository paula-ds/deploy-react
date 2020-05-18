import React, { Component } from 'react';
import './App.css';
import io from 'socket.io-client';
//import StocksGraph from "./components/StocksGraph.jsx";

// SUPUESTO: En la rúbrica dice que usuario entra y se conecta
// cambio porcentual se calculó con = ((V2-V1)/V1) × 100
// se asume que usuario conectado es racional y si está conectado, no apretará el botón de volver a conectarse

class App extends Component {  // estructura de https://github.com/fmsandoval/IIC3103_T3/
  constructor(props) {
    super(props);
    this.state = {
      estado:false,   
      estado_ex:false,
      stock: {},
      exchange : {},
      update : {},
      data:{},
      buy :{},
      sell:{},
      grafico:{},
      stock_all:{},
      diccionario:{},
      conexion: "Conectado",
      diccionario_acc : {},
      volumen_tot:{}  //revisar esto
    };

    this.onStock = this._onStock.bind(this);
    this.onExchange = this._onExchange.bind(this);
    this.onBuy = this._onBuy.bind(this);
    this.onSell = this._onSell.bind(this);
    this.onUpdate = this._onUpdate.bind(this);

  }

  componentDidMount() {
    this.socket = io('wss://​le-18262636.bitzonte.com', {
      path: '/stocks',
      transports: ['websocket'],
      'forceNew': true
    });
    this.socket.on('connect', function() {
      console.log("connected from the client side");
      });

    var aux = {"volumen":0};
    this.setState({ volumen_tot: aux});
    this.setState({ conexion: "Conectado"});
    this.socket.on('STOCKS', this.onStock);
    this.socket.on('EXCHANGES', this.onExchange);
    this.socket.on('BUY', this.onBuy);  //si le digo emitir buy, anda a onbuy
    this.socket.on('SELL', this.onSell);
    this.socket.on('UPDATE', this.onUpdate);

    this.requestStock(); 
    this.requestExchange();
    
    //his.requestBuy();
    //this.requestExchange(); 
  }
  
  handleClick() {
    console.log('Cliente desconectado');
    this.setState({ conexion: "Desconectado" });
    this.socket.disconnect()
   }

  reconectar() { //poner los otros on
    console.log ("Reconectando");
    this.componentDidMount()
    // this.socket = io('wss://​le-18262636.bitzonte.com', {'forceNew': true, path: '/stocks',
    // transports: ['websocket']});
    // this.setState({ conexion: "Conectado" });
    
    // this.socket.on('connect', function() {
    //   console.log("connected from the client side");
    //   });   
    // this.socket.on('STOCKS', this.onStock);
    // this.socket.on('EXCHANGES', this.onExchange);
    // this.socket.on('BUY', this.onBuy);  //si le digo emitir buy, anda a onbuy
    // this.socket.on('SELL', this.onSell);
    // this.socket.on('UPDATE', this.onUpdate);
    
    // this.requestStock(); 
    // this.requestExchange();
  }
  requestStock() {
    console.log ("entra al request stock")
    this.socket.emit("STOCKS");
  }
  requestExchange() {
    console.log ("entra al request exchange")
    this.socket.emit("EXCHANGES");
  }

  requestUpdate() {
    this.socket.emit("UPDATE");
  }

  requestBuy() {
    this.socket.emit("BUY");
  }
  requestSell() {
    this.socket.emit("SELL");
  }

  _onStock(data) {  //STOCKS SON LAS ACCIONES = EMPRESAS ABIERTAS
    //this.setState({ stock: data });  //lo borre, ojo
    console.log ("entra al on stock")
    var stock={};

    var dic = {};
    var dic2 = {};

    var largo = data.length;
    for (var i=0;i<largo;i++) {  
      
      var acc = data[i]["ticker"];
      stock[acc] = {"company_name": data[i]["company_name"],"quote_base":data[i]["quote_base"], "country":data[i]["country"], "click":0 }
      var nombre = data[i]["company_name"];
      dic[nombre] = acc;
      dic2[acc] = nombre;
    }
    this.setState({ stock_all: stock }); //dejar como ticker: {lo otro }
    this.setState({ estado: true });
    this.setState({ diccionario: dic });
    this.setState({ diccionario_acc: dic2 });

    //inicializar update:

  }
  _onExchange(data) {  //todos los mercados quetienen en listed companies las acciones que se transan ahí
    //formato listed_companyes ={nombres:volumen compra}
    var acciones= {};
    var exchanges = {};
    var largo = Object.keys(data).length
    var largo2 = 0;
    var volumen = 0;
    var volumen_total =0;
    var suma_sell =0;
    var suma_buy = 0;
    for (var i=0;i<largo;i++) {  //por cada exchange
      //console.log("Viendo exchange",Object.keys(data)[i] )
      volumen = 0;
      suma_sell =0;
      acciones= {};
      suma_buy = 0;
      var key = Object.keys(data)[i]
      //estoy en {name: "Nasdaq Stock Market", exchange_ticker: "NASDAQ", }
      var companias =  data[key]["listed_companies"]
      largo2 = companias.length;
      var s=0;
      var b=0;
      //console.log(key,"Viendo companias",data[key]["listed_companies"])
      for (var j=0;j<largo2;j++){
        var nombre = companias[j];
        var acc = this.state.diccionario[nombre];  //acronimo acción
        //voy a buy
        s=this.state.sell[acc];
        b=this.state.buy[acc];
        if (!s){
          s=0
        }
        if (!b){
          b=0
        }
        volumen+=s;
        volumen+=b;
        suma_buy+= b;
        suma_sell+=s;
        acciones[nombre] = {"sell":s,"buy":b };  //nombre de la compañia: {}
        //console.log("Viendo volumen sell",s)
        //console.log("Viendo vol buy",b)
        }
      
      volumen_total+= volumen;
      exchanges[key] = data[key];
      exchanges[key]["listed_companies"] = acciones;
      //console.log(key ,"diccionarios en exhcange salen a´si: ", exchanges[key]["listed_companies"])
      exchanges[key]["volumen_transado"] = volumen;
      exchanges[key]["cantidad_acciones"] = largo2;
      //console.log("acciones:", largo2)

      exchanges[key]["suma_sell"] = suma_sell;
      exchanges[key]["suma_buy"] = suma_buy;
      var total = this.state.volumen_tot["volumen"];
      //console.log("participacr:",this.roundToTwo(volumen*100/total));

      exchanges[key]["participacion"] = (volumen*100/total).toFixed(2); 
      //console.log("participacion  :", exchanges[key]["participacion"])
      //console.log("buy  :", exchanges[key]["listed_companies"]["Facebook Inc."]);
      } 
    //volumen total, ver si ponerlo con las funciones de arriba que se ejecutan altiro
    
    var aux={};
    //console.log("volumen total de ecahgnee es: ", volumen_total)
    aux["volumen"] = volumen_total;
    
    this.setState({ exchange: exchanges });
    this.setState({ volumen_tot: aux});
    this.setState({ estado_ex: true});
    //console.log("volumen total this es ", this.state.volumen_tot)

    //console.log("viiodsa:",this.state.exchange["NASDAQ"]["participacion"]);

    //llenar variables del exchange
    //this.state.buy -> volumen compra
    //this.state.sell -> volumen venta
    //this
    //volumen total transado -> volumen
      

    }

  actualizar_buy(ticker, cantidad){
    var exchanges = this.state.exchange;
    var name = this.state.diccionario_acc[ticker]
    //console.log("estado volumen buy: ", this.state.volumen_tot)
    var aux = this.state.volumen_tot;
   
    for (var ex in exchanges){
      exchanges[ex]["cantidad_acciones"] = Object.keys(exchanges[ex]["listed_companies"]).length;
      for (var action in exchanges[ex]["listed_companies"]){
        if (action === name){
          exchanges[ex]["volumen_transado"] += cantidad;
          aux["volumen"] += cantidad;
          exchanges[ex]["listed_companies"][name]["buy"]+= cantidad;
          exchanges[ex]["suma_buy"] += cantidad;
        }
      }
    }
    this.setState({ volumen_tot: aux});
    for (var exc in exchanges){
      exchanges[exc]["participacion"] = (exchanges[exc]["volumen_transado"]*100/this.state.volumen_tot["volumen"]).toFixed(2);
    }
    this.setState({ exchange: exchanges });
  }

  actualizar_sell(ticker, cantidad){
    
    var exchanges = this.state.exchange;
    var name = this.state.diccionario_acc[ticker]
    //console.log("estado volumen sell: ", this.state.volumen_tot)
    var aux = this.state.volumen_tot;
    
    for (var ex in exchanges){
      //console.log("acciones en sell: ",Object.keys(exchanges[ex]["listed_companies"]).length)
      exchanges[ex]["cantidad_acciones"] =Object.keys(exchanges[ex]["listed_companies"]).length
      for (var action in exchanges[ex]["listed_companies"]){
        if (action === name){
          exchanges[ex]["volumen_transado"] += cantidad;
          aux["volumen"] += cantidad;
          exchanges[ex]["listed_companies"][name]["sell"]+= cantidad;
          exchanges[ex]["suma_sell"] += cantidad;
        }
      }
    }
    this.setState({ volumen_tot: aux});
    for (var exc in exchanges){
      exchanges[exc]["participacion"] = (exchanges[exc]["volumen_transado"]*100/this.state.volumen_tot["volumen"]).toFixed(2);
    }
    this.setState({ exchange: exchanges });
  }
  
  _onUpdate(data) { //valor historico de todas las acciones
    //time sera siempre del ultimo

    var ticker= data["ticker"];
    var estado = this.state.update;
    //console.log("new state es ", estado);
    var todosd=[];
    var fifo= todosd.push(data);
    this.setState({grafico: fifo});

    var largo = Object.keys(this.state.update).length;
    var presente = 0;
    var dic = {};
    //console.log("largo del dic",Object.keys(this.state.update).length );
    for (var i=0;i<largo;i++) {  //si está, parar
      if (Object.keys(this.state.update)[i] === ticker) {
        //console.log("está accion ", ticker);
        presente =1;
        //}
        dic = {"valor_alto":this.state.update[ticker]["valor_alto"] , "valor_bajo":this.state.update[ticker]["valor_bajo"] , "ultimo": this.state.update[ticker]["ultimo"]};
        dic["var"] = (((data["value"]-this.state.update[ticker]["ultimo"])/this.state.update[ticker]["ultimo"]) * 100).toFixed(2);
        if (this.state.update[ticker]["valor_alto"] < data["value"]){
          dic["valor_alto"] = data["value"];
          //this.setState({update: new_state});
        }
        if (this.state.update[ticker]["valor_bajo"] > data["value"]){
          dic["valor_bajo"] = data["value"];
          //this.setState({update: new_state});
        }
        dic["ultimo"] = data["value"];
        dic["time"] = data["time"];
        estado[ticker] = dic;
      } 
    }
    
    if (presente === 0){  //si no esta
      //console.log("NOOOOOOOOOOO");
      dic = {"valor_alto":data["value"], "valor_bajo":data["value"], "ultimo": data["value"], "time": data["time"], "var":0};
      //console.log("dic es",dic);
      estado[ticker] = dic;
      //console.log("nuevo stado:",estado);
      this.setState({update: estado});
    }
  }

  _onBuy(data) {  //volumen de buy agregado a sell;
    //STOOOOCK
    var ticker= data["ticker"];
    var new_state = this.state.stock;
    var estado_buy = this.state.buy;
    var estado_sell = this.state.sell;
    var largo = Object.keys(this.state.stock).length;
    var presente = 0;
    for (var i=0;i<largo;i++) {  //si esta, parar
      var key = Object.keys(this.state.stock)[i];
      if ( key === ticker) {
        presente =1;
        new_state[ticker] += data["volume"];
        this.setState({stock: new_state});
        //para exchanges
        estado_buy[ticker] += data["volume"];
        this.setState({buy: estado_buy});
        this.actualizar_buy(ticker, data["volume"]);
      } 

    }
    if (presente === 0){  //no esta
      new_state[ticker] = data["volume"];
      this.setState({stock: new_state});

      //exchange
      estado_buy[ticker] = data["volume"];
      this.setState({buy : estado_buy});
      this.actualizar_buy(ticker, data["volume"]);

      //sell exhange
      estado_sell[ticker] = 0;
      this.setState({sell : estado_sell});

    }
  }

  _onSell(data) {  //volumen de sell agregado a buy;
    //console.log("ventaAAAAAAAAAAAAAAAAAAAAA;");
    var ticker= data["ticker"];
    var new_state = this.state.stock;
    var estado_buy = this.state.buy;
    var estado_sell = this.state.sell;
    var largo = Object.keys(this.state.stock).length;
    var presente = 0;
    for (var i=0;i<largo;i++) {  //parar
      if (Object.keys(this.state.stock)[i] === ticker) {
        presente =1;
        new_state[ticker] += data["volume"];
        this.setState({stock: new_state});

        //para exchanges
        estado_sell[ticker] += data["volume"];
        this.setState({sell: estado_sell});
        this.actualizar_sell(ticker, data["volume"]);
      } 
    }
    if (presente === 0){  //no esta
      new_state[ticker] = data["volume"];
      this.setState({stock: new_state});

      //exchange
      estado_sell[ticker] = data["volume"];
      this.setState({sell : estado_sell});
      this.actualizar_sell(ticker, data["volume"]);

      //buy exchange
      estado_buy[ticker] = 0;
      this.setState({buy : estado_buy});

    }}


  seleccionar = (accion) => {
      console.log("hago click");
    }
    
  
  // bind deja esperando variable llena de data, si apreto boton se imprime
  render() {
    const items = [];
    const items_exchange = [];
    if (this.state.estado_ex === true){
      for (var key in this.state.exchange) {
        items_exchange.push(
          <tr>
              <td>{this.state.exchange[key]["exchange_ticker"]} </td>
              <td>{this.state.exchange[key]["name"]} </td>
              <td>{this.state.exchange[key]["country"]} </td>
              <td>{this.state.exchange[key]["address"]} </td>
              <td>
              {Object.keys(this.state.exchange[key]["listed_companies"]).join(", ")}
              </td> 
              <td>{this.state.exchange[key]["suma_buy"] }</td> 
              <td>{this.state.exchange[key]["suma_sell"] }</td> 
              <td>{this.state.exchange[key]["volumen_transado"] }</td> 
              <td>{this.state.exchange[key]["cantidad_acciones"] }</td> 
              <td>{this.state.exchange[key]["participacion"] }</td>             
          </tr>)
      }
    }

    if (this.state.estado === true){
      //STOCKS
      for (var ky in this.state.stock) {
        if (this.state.update[ky]){
        //console.log(this.state.update) inicializar todo en 0
          items.push(
              <tr onClick={this.seleccionar.bind(this, ky)} >
                  <td> {ky} </td>
                  <td> {this.state.stock_all[ky]["company_name"]}</td> 
                  <td> {this.state.stock_all[ky]["country"]}</td> 
                  <td> {this.state.stock_all[ky]["quote_base"]}</td> 
                  <td> {this.state.stock[ky]}</td>
                  <td> {this.state.update[ky]["valor_alto"]}</td> 
                  <td> {this.state.update[ky]["valor_bajo"]}</td> 
                  <td> {this.state.update[ky]["ultimo"]}</td> 
                  <td> {this.state.update[ky]["var"]}</td>  
              </tr>
          )}
        else{
          items.push(
            <tr onClick={this.seleccionar.bind(this, ky)} >
                <td> {ky} </td>
                <td> {this.state.stock_all[ky]["company_name"]}</td> 
                <td> {this.state.stock_all[ky]["country"]}</td> 
                <td> {this.state.stock_all[ky]["quote_base"]}</td> 
                <td> {this.state.stock[ky]}</td>
                <td> - </td>
                <td> - </td>
                <td> - </td>
                <td> - </td>
            </tr>
        )
        }

      }}

    return ( 
      <div>     
        <h4>Tu estado es: {this.state.conexion}</h4>
        
        <button onClick={this.handleClick.bind(this)}>  
          Desconectar
        </button>
        <br/><br/>
        <button onClick={this.componentDidMount.bind(this)}>  
          Volver a conectar
        </button>
        <br/><br/>
        <h2 align="center"> STOCKS </h2>
          <table  className='GeneratedTable' >
          <thead>
          <tr>
          <th>Ticker</th>
          <th>Nombre empresa</th>
          <th>País</th>
          <th>Quote Base</th>
          <th>Volumen total transado</th>
          <th>Alto histórico</th>
          <th>Bajo histórico</th>
          <th>Último precio</th>
          <th>Variación porcentual</th>
          </tr>
          </thead>

          <tbody>
              {items}
          </tbody>
          </table>
          
          &nbsp;
          &nbsp;
          &nbsp;
         

        <h2 align="center"> EXCHANGES </h2>
        
          <table  className='GeneratedTable' >
          <thead>
          <tr>
          <th>Exchange ticker</th>
          <th>Nombre</th>
          <th>País</th>
          <th>Dirección</th>
          <th>Compañías listadas</th>
          <th>Volumen Compra</th>
          <th>Volumen Venta</th>
          <th>Volumen total</th>
          <th>Cantidad Acciones</th>
          <th>Participación de Mercado</th>
          </tr>
          </thead>
          <tbody>
              {items_exchange}
          </tbody>
          </table>

          &nbsp;
          &nbsp;
        </div>
    )
  }
  }
//para el gráfico añadir <StocksGraph stocks={this.state.update} />

export default App;
