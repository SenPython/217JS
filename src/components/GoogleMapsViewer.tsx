import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { MapPin, Info, Compass, HelpCircle, Navigation, Key } from 'lucide-react';
import { User } from '../types';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim() !== '';

interface GoogleMapsViewerProps {
  users: User[];
  currentUser: User | null;
}

export default function GoogleMapsViewer({ users, currentUser }: GoogleMapsViewerProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<'roadmap' | 'satellite'>('roadmap');
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);

  const [googleCenter, setGoogleCenter] = useState({ lat: 28.6139, lng: 77.2090 });
  const [googleZoom, setGoogleZoom] = useState(5);

  // Filter users who are currently sharing location
  const sharingUsers = users.filter(u => u.isSharingLocation && u.location);

  // Post dynamic location updates continuously to Leaflet Map iframe when coordinates or active sharing changes
  useEffect(() => {
    if (!hasValidKey && iframeRef.current) {
      const payload = {
        type: 'update_users',
        users,
        currentUserId: currentUser?.id
      };
      iframeRef.current.contentWindow?.postMessage(payload, '*');
    }
  }, [users, currentUser, hasValidKey]);

  // Synchronize mapStyle choices to Leaflet iframe
  useEffect(() => {
    if (!hasValidKey && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage({
        type: 'toggle_map_style',
        style: mapStyle
      }, '*');
    }
  }, [mapStyle, hasValidKey]);

  const focusOnUser = (u: User) => {
    if (!u.location) return;
    const { lat, lng } = u.location;
    if (!hasValidKey && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage({
        type: 'focus_user',
        lat,
        lng
      }, '*');
    }
    setGoogleCenter({ lat, lng });
    setGoogleZoom(19);
  };

  const fitAllBounds = () => {
    if (!hasValidKey && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage({
        type: 'fit_all_bounds'
      }, '*');
    }
    setGoogleCenter({ lat: 28.6139, lng: 77.2090 });
    setGoogleZoom(5);
  };

  // Fallback view when no Google Maps key is entered: Render beautiful OpenStreetMap interactive tiles automatically!
  if (!hasValidKey) {
    const leafletHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #020617; }
    /* Dark Matter styled leaflet layout */
    .leaflet-container { background: #020617; }
    .custom-avatar-pin {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
    }
    .custom-avatar-ring {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid #6366f1;
      background: #090d16;
      box-shadow: 0 4px 10px rgba(0,0,0,0.6);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .custom-avatar-ring.current {
      border-color: #ec4899;
    }
    .custom-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
    .pin-pulse {
      position: absolute;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.4);
      animation: ripple 1.6s infinite ease-out;
      z-index: -1;
    }
    @keyframes ripple {
      0% { transform: scale(0.6); opacity: 0.9; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .leaflet-popup-content-wrapper {
      background: #0f172a !important;
      color: #f8fafc !important;
      border-radius: 12px !important;
      border: 1px solid #334155 !important;
      font-family: ui-sans-serif, system-ui, sans-serif !important;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
    }
    .leaflet-popup-tip {
      background: #0f172a !important;
    }
    .popup-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 2px;
    }
    .popup-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      object-fit: cover;
      border: 2.5px solid #334155;
    }
    .popup-name {
      font-weight: bold;
      font-size: 11.5px;
      color: #ffffff;
      margin: 0;
    }
    .popup-meta {
      font-size: 9px;
      color: #94a3b8;
      margin: 2px 0 0 0;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    window.initialBoundsSet = false;
    
    // Initialize standard Leaflet map with zoom controls & maximum zoom levels support up to 22 (street/neighborhood level zoom)
    var map = L.map('map', { 
      zoomControl: false,
      maxZoom: 22,
      minZoom: 2
    }).setView([28.6139, 77.2090], 5); // Centered on India coordinate hub initially
    
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Dark styled roadmap map tiles (CartoDB Dark Matter) - Support extreme granular zoom-in upscaling safely
    var darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB &copy; OpenStreetMap contributors',
      maxZoom: 22,
      maxNativeZoom: 20
    }).addTo(map);

    // High fidelity Esri World Imagery Satellite layer supporting street/house visual resolutions
    var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
      maxZoom: 22,
      maxNativeZoom: 19
    });

    var markersMap = {};

    window.addEventListener('message', function(event) {
      if (!event.data || typeof event.data !== 'object') return;
      var type = event.data.type;
      
      if (type === 'toggle_map_style') {
        var style = event.data.style;
        if (style === 'satellite') {
          if (map.hasLayer(darkLayer)) {
            map.removeLayer(darkLayer);
          }
          if (!map.hasLayer(satelliteLayer)) {
            satelliteLayer.addTo(map);
          }
        } else {
          if (map.hasLayer(satelliteLayer)) {
            map.removeLayer(satelliteLayer);
          }
          if (!map.hasLayer(darkLayer)) {
            darkLayer.addTo(map);
          }
        }
      }

      if (type === 'focus_user') {
        var lat = event.data.lat;
        var lng = event.data.lng;
        // Fly directly and zoom closely down to house/building level (zoom 19)
        map.setView([lat, lng], 19, { animate: true, duration: 1.2 });
        
        // Find existing marker to trigger click popup action for street visualization
        for (var uid in markersMap) {
          var mLatLng = markersMap[uid].getLatLng();
          if (Math.abs(mLatLng.lat - lat) < 0.0001 && Math.abs(mLatLng.lng - lng) < 0.0001) {
            markersMap[uid].openPopup();
            break;
          }
        }
      }

      if (type === 'fit_all_bounds') {
        var latlngs = [];
        for (var uid in markersMap) {
          latlngs.push(markersMap[uid].getLatLng());
        }
        if (latlngs.length > 0) {
          var bounds = L.latLngBounds(latlngs);
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
      
      if (type === 'update_users') {
        var users = event.data.users || [];
        var currentUserId = event.data.currentUserId;
        var activeIds = {};

        users.forEach(function(u) {
          if (!u.isSharingLocation || !u.location) return;
          var uid = u.id;
          activeIds[uid] = true;
          var lat = u.location.lat;
          var lng = u.location.lng;
          var isCurrent = (uid === currentUserId);

          var iconHtml = '<div class="custom-avatar-pin">';
          iconHtml += '<div class="pin-pulse" style="background: ' + (isCurrent ? 'rgba(236,72,153,0.35)' : 'rgba(99,102,241,0.35)') + '"></div>';
          iconHtml += '<div class="custom-avatar-ring ' + (isCurrent ? 'current' : '') + '">';
          iconHtml += '<img class="custom-avatar-img" src="' + u.avatar + '" referrerpolicy="no-referrer" />';
          iconHtml += '</div></div>';

          var customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-pin-wrapper',
            iconSize: [44, 44],
            iconAnchor: [22, 22]
          });

          var label = isCurrent ? ' (You)' : '';
          var popupContent = '<div class="popup-card">';
          popupContent += '<img class="popup-avatar" src="' + u.avatar + '" referrerpolicy="no-referrer" />';
          popupContent += '<div>';
          popupContent += '<h5 class="popup-name">' + u.name + label + '</h5>';
          popupContent += '<p class="popup-meta">lat: ' + lat.toFixed(5) + ', lng: ' + lng.toFixed(5) + '</p>';
          popupContent += '<p class="popup-meta" style="color: #4ade80; font-weight: 500;">✓ Live Location On</p>';
          popupContent += '</div></div>';

          if (markersMap[uid]) {
            markersMap[uid].setLatLng([lat, lng]);
            markersMap[uid].setIcon(customIcon);
            markersMap[uid].setPopupContent(popupContent);
          } else {
            var marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
            marker.bindPopup(popupContent);
            
            // Zoom in down to building level on clicking any marker manually
            marker.on('click', function(e) {
              map.setView(e.target.getLatLng(), 19, { animate: true });
            });
            
            markersMap[uid] = marker;
          }
        });

        // Delete inactive trackers
        for (var uid in markersMap) {
          if (!activeIds[uid]) {
            map.removeLayer(markersMap[uid]);
            delete markersMap[uid];
          }
        }

        // Center map to display all active tracking profiles gracefully ONLY ON INITIAL load to avoid overwriting user zooming
        var latlngs = [];
        for (var uid in markersMap) {
          latlngs.push(markersMap[uid].getLatLng());
        }
        if (latlngs.length > 0 && !window.initialBoundsSet) {
          var bounds = L.latLngBounds(latlngs);
          if (latlngs.length === 1) {
            map.setView(latlngs[0], 19);
          } else {
            map.fitBounds(bounds, { padding: [55, 55] });
          }
          window.initialBoundsSet = true;
        }
      }
    });
  </script>
</body>
</html>
`;

    return (
      <div id="interactive-map-sandbox" className="relative w-full h-[360px] md:h-[480px] lg:h-[550px] rounded-2xl overflow-hidden border border-slate-800">
        <iframe
          ref={iframeRef}
          title="Leaflet Mapping Tracker"
          srcDoc={leafletHTML}
          className="w-full h-full border-0 rounded-2xl bg-slate-950"
          onLoad={() => {
            // Push initial data immediately on load completion
            setTimeout(() => {
              if (iframeRef.current) {
                iframeRef.current.contentWindow?.postMessage({
                  type: 'update_users',
                  users,
                  currentUserId: currentUser?.id
                }, '*');
                iframeRef.current.contentWindow?.postMessage({
                  type: 'toggle_map_style',
                  style: mapStyle
                }, '*');
              }
            }, 600);
          }}
        />
        {/* Status indicator floating overlay badge */}
        <div className="absolute top-3.5 left-3.5 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5 text-[9px] font-mono select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-white font-bold uppercase tracking-wide">Leaflet Real-time Live Maps</span>
        </div>

        {/* Dynamic Selector floating panel for fallback styles */}
        <div className="absolute top-3.5 right-3.5 bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-800/90 flex gap-1 z-10 shadow-2xl">
          <button
            onClick={() => setMapStyle('roadmap')}
            className={`px-3 py-1.5 text-[9px] font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider ${
              mapStyle === 'roadmap'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Roadmap
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-3 py-1.5 text-[9px] font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider ${
              mapStyle === 'satellite'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Real-time Indian Streets & House Focus HUD Overlay */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-950/95 backdrop-blur-md p-3 rounded-xl border border-slate-800/90 max-h-[145px] overflow-hidden z-20 shadow-2xl flex flex-col gap-2 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 flex-wrap gap-1">
            <span className="text-[9px] text-white font-bold uppercase tracking-widest font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
              🔍 Indian Streets & House Live Focus Tracker
            </span>
            <button
              onClick={fitAllBounds}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[8.5px] text-slate-300 font-bold rounded-lg cursor-pointer transition-all border border-slate-700 uppercase"
            >
              🌐 Reset Bounds
            </button>
          </div>
          <div className="flex gap-2 items-center overflow-x-auto py-1 scrollbar-thin">
            {sharingUsers.length === 0 ? (
              <span className="text-[9.5px] text-slate-500 font-mono italic">No buddies are sharing location right now. Toggle "Share Location" on.</span>
            ) : (
              sharingUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => focusOnUser(u)}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-805 border border-slate-800/80 px-2.5 py-1.5 rounded-xl shrink-0 cursor-pointer text-left transition-all active:scale-98"
                >
                  <div className="relative">
                    <img src={u.avatar} className="w-5 h-5 rounded-full object-cover border border-slate-700" referrerPolicy="no-referrer" />
                    <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-450 rounded-full border border-slate-950"></span>
                  </div>
                  <div className="leading-none">
                    <p className="text-[10px] font-bold text-slate-100">{u.name}</p>
                    <p className="text-[7.5px] text-slate-450 font-mono mt-0.5">Zoom to street 🏠</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

      </div>
    );
  }

  return (
    <div id="google-map-active" className="relative w-full h-[360px] md:h-[480px] lg:h-[550px] rounded-2xl overflow-hidden border border-slate-800">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          center={googleCenter}
          zoom={googleZoom}
          mapId="DEMO_MAP_ID"
          mapTypeId={mapStyle === 'roadmap' ? 'roadmap' : 'satellite'}
          maxZoom={21}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          {sharingUsers.map((u) => <MarkerWithWindow key={u.id} user={u} isCurrent={u.id === currentUser?.id} />)}
        </Map>
      </APIProvider>

      {/* Dynamic Selector floating panel for active styles */}
      <div className="absolute top-3.5 right-3.5 bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-800/90 flex gap-1 z-10 shadow-2xl">
        <button
          onClick={() => setMapStyle('roadmap')}
          className={`px-3 py-1.5 text-[9px] font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider ${
            mapStyle === 'roadmap'
              ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Roadmap
        </button>
        <button
          onClick={() => setMapStyle('satellite')}
          className={`px-3 py-1.5 text-[9px] font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider ${
            mapStyle === 'satellite'
              ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Satellite
        </button>
      </div>

      {/* Real-time Indian Streets & House Focus HUD Overlay */}
      <div className="absolute bottom-3 left-3 right-3 bg-slate-950/95 backdrop-blur-md p-3 rounded-xl border border-slate-800/90 max-h-[145px] overflow-hidden z-20 shadow-2xl flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1 flex-wrap gap-1">
          <span className="text-[9px] text-white font-bold uppercase tracking-widest font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
            🔍 Indian Streets & House Live Focus Tracker
          </span>
          <button
            onClick={fitAllBounds}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[8.5px] text-slate-300 font-bold rounded-lg cursor-pointer transition-all border border-slate-700 uppercase"
          >
            🌐 Reset Bounds
          </button>
        </div>
        <div className="flex gap-2 items-center overflow-x-auto py-1 scrollbar-thin">
          {sharingUsers.length === 0 ? (
            <span className="text-[9.5px] text-slate-500 font-mono italic">No buddies are sharing location right now. Toggle "Share Location" on.</span>
          ) : (
            sharingUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => focusOnUser(u)}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-805 border border-slate-800/80 px-2.5 py-1.5 rounded-xl shrink-0 cursor-pointer text-left transition-all active:scale-98"
              >
                <div className="relative">
                  <img src={u.avatar} className="w-5 h-5 rounded-full object-cover border border-slate-700" referrerPolicy="no-referrer" />
                  <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-450 rounded-full border border-slate-950"></span>
                </div>
                <div className="leading-none">
                  <p className="text-[10px] font-bold text-slate-100">{u.name}</p>
                  <p className="text-[7.5px] text-slate-450 font-mono mt-0.5">Zoom to street 🏠</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

interface MarkerWithWindowProps {
  user: User;
  isCurrent: boolean;
  key?: string;
}

function MarkerWithWindow({ user, isCurrent }: MarkerWithWindowProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  if (!user.location) return null;

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: user.location.lat, lng: user.location.lng }}
        onClick={() => setOpen(true)}
      >
        <div className="relative group cursor-pointer" style={{ width: '40px', height: '40px' }}>
          <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping scale-75 opacity-25"></div>
          <div className={`p-0.5 rounded-full ${isCurrent ? 'bg-indigo-500' : 'bg-pink-500'} border-2 border-slate-900 shadow-xl overflow-hidden width-full height-full`}>
            <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </div>
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="text-slate-900 p-1 font-sans">
            <div className="flex items-center gap-2 mb-1.5">
              <img src={user.avatar} className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
              <div className="leading-tight">
                <h4 className="font-bold text-xs text-slate-900">{user.name} {isCurrent ? '(You)' : ''}</h4>
                <p className="text-[10px] text-slate-500">{user.email}</p>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-1.5 flex flex-col gap-1 text-[10px] text-slate-600 font-mono">
              <div className="flex justify-between gap-4">
                <span>Latitude:</span>
                <span className="font-bold text-slate-800">{user.location.lat.toFixed(6)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Longitude:</span>
                <span className="font-bold text-slate-800">{user.location.lng.toFixed(6)}</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5 font-sans">
                Updated: {new Date(user.location.updatedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
