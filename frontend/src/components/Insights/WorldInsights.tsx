import React,{useEffect,useState} from 'react';
import {fetchWorldKpis,fetchWorldTimeseries,fetchWorldClusters} from '../../services/api';
import {useStore} from '../../store/useStore';
import {MissingData} from './MissingData';
import {ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip,ReferenceLine} from 'recharts';
export const WorldInsights=()=>{
 const [data,setData]=useState<any>(null);const [series,setSeries]=useState<any[]>([]);const [clusters,setClusters]=useState<any[]>([]);const {openDetailDrawer,setActiveView}=useStore();
 useEffect(()=>{let active=true;Promise.all([fetchWorldKpis(),fetchWorldTimeseries(),fetchWorldClusters()]).then(([k,t,c])=>{if(active){setData(k);setSeries(t.timeseries||[]);setClusters(c.clusters||[])}}).catch(()=>{});return()=>{active=false}},[]);
 const fmt=(v:any)=>v==null?'-':v.toLocaleString(undefined,{maximumFractionDigits:1});
 return <div className="observed-dashboard"><header><span className="micro-label">PLANETARY OBSERVATIONS</span><h2>A world in view.</h2><p>NASA MODIS + VIIRS · observed activity, with coverage gaps visible.</p><span className="status-label">Partial archive</span></header>
 <div className="metric-grid">{[['Detections · last 24h',data?.detections_last_24h],['7d vs seasonal median',data?.pct_vs_seasonal_median],['Elevated countries',data?.elevated_unusual_countries_count],['Total FRP · 24h · GW',data?.total_frp_gw]].map(([k,v])=><div key={k}><span>{k}</span><strong>{fmt(v)}</strong></div>)}</div>
 <MissingData message="The full global archive and seasonal baseline are not ingested. Live refresh requests all available constellations."/>
 <section><h3>Global burning history</h3><p>{series[0]?.month||'2000-01'} - {series.at(-1)?.month||'now'} · observed cell-days only; no filled gaps</p><div style={{height:180,minWidth:0}}><ResponsiveContainer width="100%" height="100%"><BarChart data={series}><XAxis dataKey="month" fontSize={9}/><YAxis width={38} fontSize={9}/><Tooltip/><Bar dataKey="observed_cell_days" fill="var(--heat-3)" isAnimationActive={false}/>{['2012-01','2018-01','2024-01'].map(x=><ReferenceLine key={x} x={x} stroke="var(--text-muted)"/>)}</BarChart></ResponsiveContainer></div><p>Sensor transitions: VIIRS S-NPP 2012 · NOAA-20 2018 · NOAA-21 2024. Seasonal band unavailable.</p></section>
 <section><h3>Most unusual right now</h3><p>Not ingested yet - country rankings require complete historical comparison windows.</p></section>
 <section><h3>Continent breakdown & hemisphere seasons</h3><p>Not ingested yet - global geographic and seasonal coverage is incomplete.</p></section>
 <section><h3>Largest observed groups · last 7 days</h3><p>One-degree spatial bins · not incident boundaries</p>{clusters.length?clusters.map((c,i)=><button key={i} className="cluster-row" onClick={()=>openDetailDrawer({title:c.nearest_place,type:'cluster',data:c})}><span>{c.nearest_place}</span><strong>{fmt(c.total_frp_mw)} MW ↗</strong></button>):<p>No verified groups available for this window.</p>}</section>
 <footer><p>As of {data?.as_of||'unavailable'} · NASA FIRMS</p><button className="section-link" onClick={()=>setActiveView('data-status')}>Inspect data coverage ↗</button></footer></div>
}
