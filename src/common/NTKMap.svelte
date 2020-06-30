<script>
  import Map from "./map/Map.svelte";
  import MapMarker from "./map/MapMarker.svelte";
  import NoMap from "./map/NoMap.svelte";

  export let lat;
  export let lon;
  export let mapDetails;
</script>

{#if mapDetails}
  <Map lat={mapDetails.lat} lon={mapDetails.lon} zoom={3.5}>
    <MapMarker
      lat={mapDetails.lat}
      lon={mapDetails.lon}
      label={mapDetails.label} />
    <!-- <MapMarker lat={33.8981} lon={-118.4169} label="Svelte Barbershop & Essentials"/>
	<MapMarker lat={29.7230} lon={-95.4189} label="Svelte Waxing Studio"/>
	<MapMarker lat={28.3378} lon={-81.3966} label="Svelte 30 Nutritional Consultants"/>
	<MapMarker lat={40.6483} lon={-74.0237} label="Svelte Brands LLC"/>
	<MapMarker lat={40.6986} lon={-74.4100} label="Svelte Medical Systems"/> -->
  </Map>
{:else}
  <NoMap />
{/if}
