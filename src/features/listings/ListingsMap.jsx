import { useEffect, useMemo, useRef } from 'react'
import PropTypes from 'prop-types'
import L from 'leaflet'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Bed, Bath } from 'lucide-react'
import { ListingShape } from '../../types/propTypes'
import {
  pinLabel,
  placeable,
  boundsFromListings,
  plainBounds,
} from './mapUtils'

// San Diego, the only city listed so far. Used when nothing can be pinned.
const DEFAULT_CENTER = [32.7157, -117.1611]
const DEFAULT_ZOOM = 11
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

/** Price-label pin. Approximate (neighborhood-center) pins are outlined. */
function pinIcon({ price, approximate }) {
  const classes = ['rentra-pin']
  if (approximate) classes.push('rentra-pin--approx')
  return L.divIcon({
    className: '',
    html: `<span class="${classes.join(' ')}">${pinLabel(price)}</span>`,
    iconSize: null,
    iconAnchor: [0, 0],
    popupAnchor: [24, -6],
  })
}

/** Fit the view to every pin whenever the set of listings changes. */
function FitToListings({ listings }) {
  const map = useMap()
  const key = useMemo(
    () =>
      placeable(listings)
        .map(x => x.listing.id)
        .sort()
        .join('|'),
    [listings]
  )
  const lastKey = useRef(null)
  useEffect(() => {
    if (key === lastKey.current) return
    lastKey.current = key
    const bounds = boundsFromListings(listings)
    if (bounds) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
    else map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
  }, [key, listings, map])
  return null
}

FitToListings.propTypes = {
  listings: PropTypes.arrayOf(ListingShape).isRequired,
}

/** Report the visible bounds to the parent after every pan or zoom. */
function BoundsReporter({ onBoundsChange }) {
  const map = useMapEvents({
    moveend: () => onBoundsChange?.(plainBounds(map.getBounds())),
  })
  useEffect(() => {
    onBoundsChange?.(plainBounds(map.getBounds()))
  }, [map, onBoundsChange])
  return null
}

BoundsReporter.propTypes = {
  onBoundsChange: PropTypes.func,
}

/**
 * One marker. The icon is memoized and the hover highlight is a class on
 * the marker element: swapping the icon on hover would replace the DOM
 * node under the cursor and refire mouseover/mouseout in a loop.
 */
function PricePin({ listing, position, active, onHover, onOpen }) {
  const markerRef = useRef(null)
  const approximate = Boolean(listing.mapPosition?.approximate)
  const icon = useMemo(
    () => pinIcon({ price: listing.price, approximate }),
    [listing.price, approximate]
  )

  useEffect(() => {
    const el = markerRef.current?.getElement?.()
    if (el) el.classList.toggle('rentra-pin-wrap--active', active)
  }, [active])

  return (
    <Marker
      ref={markerRef}
      position={[position.lat, position.lng]}
      icon={icon}
      zIndexOffset={active ? 1000 : 0}
      eventHandlers={{
        mouseover: () => onHover?.(listing.id),
        mouseout: () => onHover?.(null),
      }}
    >
      <Popup closeButton={false} className="rentra-popup">
        <PinPopupCard listing={listing} onOpen={onOpen} />
      </Popup>
    </Marker>
  )
}

PricePin.propTypes = {
  listing: ListingShape.isRequired,
  position: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }).isRequired,
  active: PropTypes.bool,
  onHover: PropTypes.func,
  onOpen: PropTypes.func.isRequired,
}

/** Compact card inside a pin's popup. */
function PinPopupCard({ listing, onOpen }) {
  const beds = listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bd`
  return (
    <button
      type="button"
      onClick={() => onOpen(listing)}
      className="text-left w-56 group"
    >
      <img
        src={
          listing.images?.[0] ||
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'
        }
        alt={listing.title}
        className="w-full h-28 object-cover rounded-lg mb-2"
      />
      <p className="text-lg font-bold text-gray-900 leading-tight">
        ${listing.price.toLocaleString()}
        <span className="text-xs font-normal text-gray-500">/mo</span>
      </p>
      <p className="flex items-center gap-2 text-xs text-gray-700 mt-0.5">
        <span className="flex items-center gap-1">
          <Bed size={12} /> {beds}
        </span>
        <span className="flex items-center gap-1">
          <Bath size={12} /> {listing.bathrooms} ba
        </span>
      </p>
      <p className="text-xs text-gray-500 truncate mt-0.5">
        {listing.streetAddress || listing.location}
      </p>
      {listing.mapPosition?.approximate && (
        <p className="text-[11px] text-amber-700 mt-1">
          Approximate location (neighborhood)
        </p>
      )}
      <span className="block text-xs font-semibold text-brand-500 mt-1 group-hover:underline">
        View listing
      </span>
    </button>
  )
}

PinPopupCard.propTypes = {
  listing: ListingShape.isRequired,
  onOpen: PropTypes.func.isRequired,
}

/**
 * Zillow-style map of listings: OpenStreetMap tiles, price pins, hover
 * linking with the list, and a bounds callback for "search as I move".
 */
function ListingsMap({
  listings,
  hoveredId,
  onHover,
  onOpen,
  onBoundsChange,
  className,
}) {
  const pins = useMemo(() => placeable(listings), [listings])

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className={className || 'w-full h-full'}
      aria-label="Map of rentals"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <FitToListings listings={listings} />
      <BoundsReporter onBoundsChange={onBoundsChange} />
      {pins.map(({ listing, position }) => (
        <PricePin
          key={listing.id}
          listing={listing}
          position={position}
          active={hoveredId === listing.id}
          onHover={onHover}
          onOpen={onOpen}
        />
      ))}
    </MapContainer>
  )
}

ListingsMap.propTypes = {
  listings: PropTypes.arrayOf(ListingShape).isRequired,
  hoveredId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onHover: PropTypes.func,
  onOpen: PropTypes.func.isRequired,
  onBoundsChange: PropTypes.func,
  className: PropTypes.string,
}

export default ListingsMap
