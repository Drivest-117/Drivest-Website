from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


MANUAL_ALIAS_PREFERENCES = {
    "barking_tanner_street": "barking_tanner_st",
    "enfield_london": "enfield_innova_business_park",
    "isleworth_london": "isleworth_fleming_way",
    "kingston_london": "tolworth_london",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract canonical Drivest test centre coverage from the route output corpus."
    )
    parser.add_argument(
        "--output-root",
        default=None,
        help="Path to the route output root. Defaults to ../output from the site root.",
    )
    parser.add_argument(
        "--output",
        default="site/data/test-centre-coverage.en-GB.json",
        help="Output JSON path relative to the site root.",
    )
    parser.add_argument(
        "--min-routes-exclusive",
        type=int,
        default=2,
        help="Exclude centres with route counts less than or equal to this value.",
    )
    return parser.parse_args()


def is_noise_slug(slug: str) -> str | None:
    lowered = slug.lower()
    if "__" in lowered:
        return "backup_or_pre_variant"
    if re.search(r"(^|_)temp(_|$)", lowered):
        return "temporary_variant"
    if re.search(r"(^|_)backup(_|$)", lowered):
        return "backup_variant"
    return None


def read_json(path: Path) -> dict | list | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def route_list(raw: dict | list | None) -> list[dict]:
    if isinstance(raw, dict):
        routes = raw.get("routes")
        return routes if isinstance(routes, list) else []
    return raw if isinstance(raw, list) else []


def numeric(value) -> float | None:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def round_number(value: float | None, digits: int) -> float | None:
    if value is None:
        return None
    return round(value, digits)


def coord_key(coords) -> tuple[float, float] | None:
    if isinstance(coords, dict) and "lat" in coords and "lon" in coords:
        lat = numeric(coords.get("lat"))
        lon = numeric(coords.get("lon"))
        if lat is not None and lon is not None:
            return (round(lat, 6), round(lon, 6))
    if isinstance(coords, (list, tuple)) and len(coords) >= 2:
        lat = numeric(coords[0])
        lon = numeric(coords[1])
        if lat is not None and lon is not None:
            return (round(lat, 6), round(lon, 6))
    return None


def normalise_name(value: str) -> str:
    text = f" {value.lower()} "
    replacements = {
        " st ": " street ",
        " rd ": " road ",
        " ave ": " avenue ",
        " ctr ": " centre ",
        " ctr. ": " centre ",
        "&": " and ",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def first_non_empty(items: list[str]) -> str:
    for item in items:
        if item:
            return item
    return ""


def load_validation_report(path: Path) -> dict:
    raw = read_json(path)
    if not isinstance(raw, dict):
        return {}
    hint = raw.get("hint_coverage") if isinstance(raw.get("hint_coverage"), dict) else {}
    route_shape = raw.get("route_shape") if isinstance(raw.get("route_shape"), dict) else {}
    return {
        "candidates": int(numeric(raw.get("candidates")) or 0),
        "validated": int(numeric(raw.get("validated")) or 0),
        "selected": int(numeric(raw.get("selected")) or 0),
        "matchedHintRoads": int(numeric(raw.get("matched_hint_roads")) or 0),
        "hintCoverageRatio": round_number(numeric(hint.get("ratio")), 3),
        "familyCounts": dict(sorted((route_shape.get("family_counts") or {}).items())),
        "zones": sorted(route_shape.get("zones") or []),
        "rejectionCounts": dict(sorted((raw.get("rejection_counts") or {}).items())),
    }


def choose_canonical_slug(group: list[dict]) -> str:
    preferred = [item for item in group if MANUAL_ALIAS_PREFERENCES.get(item["slug"]) in {item["slug"], None}]
    if preferred:
        for item in group:
            if MANUAL_ALIAS_PREFERENCES.get(item["slug"]):
                return MANUAL_ALIAS_PREFERENCES[item["slug"]]

    ranked = sorted(
        group,
        key=lambda item: (
            -(item["routeCount"]),
            -(item["averageQualityScore"] or 0),
            len(item["slug"]),
            item["slug"],
        ),
    )
    return ranked[0]["slug"]


def group_aliases(raw_centres: list[dict]) -> dict[str, str]:
    groups: dict[tuple[tuple[float, float] | None, str], list[dict]] = defaultdict(list)
    for centre in raw_centres:
        groups[(centre["coordKey"], centre["normalisedName"])].append(centre)

    alias_map: dict[str, str] = {}
    for group in groups.values():
        if len(group) <= 1:
            continue
        canonical_slug = choose_canonical_slug(group)
        for centre in group:
            if centre["slug"] != canonical_slug:
                alias_map[centre["slug"]] = canonical_slug

    for alias_slug, canonical_slug in MANUAL_ALIAS_PREFERENCES.items():
        if any(item["slug"] == alias_slug for item in raw_centres) and any(
            item["slug"] == canonical_slug for item in raw_centres
        ):
            alias_map[alias_slug] = canonical_slug

    return alias_map


def summarise_routes(routes: list[dict]) -> dict:
    route_count = len(routes)
    difficulty_counter: Counter[str] = Counter()
    family_counter: Counter[str] = Counter()
    zone_counter: Counter[str] = Counter()
    road_counter: Counter[str] = Counter()
    validation_flag_counter: Counter[str] = Counter()
    source_pdf_counter: Counter[str] = Counter()

    distances_km: list[float] = []
    durations_min: list[float] = []
    quality_scores: list[float] = []

    sample_routes = []

    for route in routes:
        difficulty = str(route.get("difficultyLevel") or "").strip().lower()
        if difficulty:
            difficulty_counter[difficulty] += 1

        family = str(route.get("routeFamily") or "").strip().lower()
        if family:
            family_counter[family] += 1

        for zone in route.get("routeZones") or []:
            zone_text = str(zone).strip()
            if zone_text:
                zone_counter[zone_text] += 1

        for road in route.get("roadsUsed") or []:
            road_text = str(road).strip()
            if road_text:
                road_counter[road_text] += 1

        for flag in route.get("validationFlags") or []:
            flag_text = str(flag).strip()
            if flag_text:
                validation_flag_counter[flag_text] += 1

        source_pdf = str(route.get("sourcePdfName") or "").strip()
        if source_pdf:
            source_pdf_counter[source_pdf] += 1

        distance_m = numeric(route.get("distanceMeters"))
        if distance_m is None:
            distance_m = numeric(route.get("distanceM"))
        if distance_m is not None:
            distances_km.append(distance_m / 1000)

        duration_s = numeric(route.get("estimatedDurationSeconds"))
        if duration_s is None:
            duration_s = numeric(route.get("durationS"))
        if duration_s is not None:
            durations_min.append(duration_s / 60)

        quality = numeric(route.get("qualityScore"))
        if quality is not None:
            quality_scores.append(quality)

        sample_routes.append(
            {
                "id": str(route.get("id") or "").strip(),
                "name": str(route.get("name") or "").strip(),
                "distanceKm": round_number((distance_m / 1000) if distance_m is not None else None, 1),
                "durationMinutes": round_number((duration_s / 60) if duration_s is not None else None, 1),
                "difficultyLevel": difficulty or "unknown",
                "qualityScore": round_number(quality, 3),
                "routeFamily": family or "unknown",
                "routeZones": [str(zone).strip() for zone in (route.get("routeZones") or []) if str(zone).strip()],
            }
        )

    sample_routes.sort(
        key=lambda item: (
            -(item["qualityScore"] or 0),
            item["durationMinutes"] or 0,
            item["name"],
        )
    )

    def average(values: list[float], digits: int) -> float | None:
        if not values:
            return None
        return round(sum(values) / len(values), digits)

    return {
        "routeCount": route_count,
        "averageDistanceKm": average(distances_km, 1),
        "averageDurationMinutes": average(durations_min, 1),
        "averageQualityScore": average(quality_scores, 3),
        "minDistanceKm": round_number(min(distances_km) if distances_km else None, 1),
        "maxDistanceKm": round_number(max(distances_km) if distances_km else None, 1),
        "minDurationMinutes": round_number(min(durations_min) if durations_min else None, 1),
        "maxDurationMinutes": round_number(max(durations_min) if durations_min else None, 1),
        "difficultyCounts": dict(sorted(difficulty_counter.items())),
        "routeFamilyCounts": dict(sorted(family_counter.items())),
        "topZones": [
            {"name": name, "count": count}
            for name, count in zone_counter.most_common(10)
        ],
        "topRoads": [
            {"name": name, "count": count}
            for name, count in road_counter.most_common(12)
        ],
        "validationFlagCounts": dict(sorted(validation_flag_counter.items())),
        "sourcePdfCount": len(source_pdf_counter),
        "sampleRoutes": sample_routes[:6],
        "dominantDifficulty": difficulty_counter.most_common(1)[0][0] if difficulty_counter else "unknown",
    }


def load_raw_centres(output_root: Path, min_routes_exclusive: int) -> tuple[list[dict], list[dict]]:
    centres: list[dict] = []
    excluded: list[dict] = []

    for path in sorted(output_root.iterdir()):
        if not path.is_dir():
            continue

        slug = path.name
        routes_path = path / "routes.json"
        if not routes_path.exists():
            continue

        noise_reason = is_noise_slug(slug)
        raw_routes = read_json(routes_path)
        routes = route_list(raw_routes)
        route_count = len(routes)

        if noise_reason:
            excluded.append({"id": slug, "reason": noise_reason, "routeCount": route_count})
            continue

        if route_count <= min_routes_exclusive:
            excluded.append({"id": slug, "reason": "insufficient_routes", "routeCount": route_count})
            continue

        display_name = first_non_empty([str(routes[0].get("centreName") or "").strip()]) or slug.replace("_", " ").title()
        coords = routes[0].get("centreCoordinates") if routes else None
        summary = summarise_routes(routes)

        centres.append(
            {
                "slug": slug,
                "name": display_name,
                "normalisedName": normalise_name(display_name),
                "coordinates": coords,
                "coordKey": coord_key(coords),
                "routes": routes,
                "routeCount": route_count,
                "averageQualityScore": summary["averageQualityScore"],
                "summary": summary,
                "validation": load_validation_report(path / "validation_report.json"),
            }
        )

    return centres, sorted(excluded, key=lambda item: (item["reason"], item["id"]))


def extract_coverage(output_root: Path, min_routes_exclusive: int) -> dict:
    raw_centres, excluded = load_raw_centres(output_root, min_routes_exclusive)
    alias_map = group_aliases(raw_centres)

    aliases = [
        {
            "id": alias_slug,
            "canonicalId": canonical_slug,
            "reason": "duplicate_centre_variant",
        }
        for alias_slug, canonical_slug in sorted(alias_map.items())
    ]

    centres = []
    all_distances: list[float] = []
    all_durations: list[float] = []
    all_qualities: list[float] = []

    for centre in sorted(raw_centres, key=lambda item: (item["name"].lower(), item["slug"])):
        if alias_map.get(centre["slug"]):
            continue

        summary = centre["summary"]
        validation = centre["validation"]
        coords = centre["coordinates"] if isinstance(centre["coordinates"], dict) else {}
        public_slug = centre["slug"].replace("_", "-")

        for route in centre["routes"]:
            distance_m = numeric(route.get("distanceMeters"))
            if distance_m is None:
                distance_m = numeric(route.get("distanceM"))
            if distance_m is not None:
                all_distances.append(distance_m / 1000)

            duration_s = numeric(route.get("estimatedDurationSeconds"))
            if duration_s is None:
              duration_s = numeric(route.get("durationS"))
            if duration_s is not None:
                all_durations.append(duration_s / 60)

            quality = numeric(route.get("qualityScore"))
            if quality is not None:
                all_qualities.append(quality)

        centres.append(
            {
                "id": centre["slug"],
                "name": centre["name"],
                "slug": public_slug,
                "url": f"/driving-test-centres/{public_slug}",
                "routeCount": summary["routeCount"],
                "coordinates": {
                    "lat": round_number(numeric(coords.get("lat")), 6),
                    "lon": round_number(numeric(coords.get("lon")), 6),
                }
                if coords
                else None,
                "averageDistanceKm": summary["averageDistanceKm"],
                "averageDurationMinutes": summary["averageDurationMinutes"],
                "averageQualityScore": summary["averageQualityScore"],
                "minDistanceKm": summary["minDistanceKm"],
                "maxDistanceKm": summary["maxDistanceKm"],
                "minDurationMinutes": summary["minDurationMinutes"],
                "maxDurationMinutes": summary["maxDurationMinutes"],
                "difficultyCounts": summary["difficultyCounts"],
                "dominantDifficulty": summary["dominantDifficulty"],
                "routeFamilyCounts": summary["routeFamilyCounts"],
                "topZones": summary["topZones"],
                "topRoads": summary["topRoads"],
                "validationFlagCounts": summary["validationFlagCounts"],
                "sourcePdfCount": summary["sourcePdfCount"],
                "sampleRoutes": summary["sampleRoutes"],
                "validation": validation,
            }
        )

    def average(values: list[float], digits: int) -> float | None:
        if not values:
            return None
        return round(sum(values) / len(values), digits)

    total_routes = sum(centre["routeCount"] for centre in centres)

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": {
            "type": "route-corpus",
            "rootFolder": output_root.name,
            "notes": [
                "Only centres with more than the configured route threshold are included.",
                "Temporary, backup, and duplicate centre variants are excluded from the public layer.",
            ],
        },
        "filter": {
            "routeCountGreaterThan": min_routes_exclusive,
        },
        "summary": {
            "centres": len(centres),
            "routes": total_routes,
            "averageRoutesPerCentre": round(total_routes / len(centres), 1) if centres else 0,
            "averageRouteDistanceKm": average(all_distances, 1),
            "averageRouteDurationMinutes": average(all_durations, 1),
            "averageQualityScore": average(all_qualities, 3),
            "aliasCount": len(aliases),
            "excludedCount": len(excluded),
        },
        "aliases": aliases,
        "excluded": excluded,
        "centres": centres,
    }


def main() -> None:
    args = parse_args()
    site_root = Path(__file__).resolve().parent.parent
    output_root = (
        Path(args.output_root).expanduser().resolve()
        if args.output_root
        else (site_root.parent / "output").resolve()
    )
    output_path = (site_root / args.output).resolve()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    data = extract_coverage(output_root, args.min_routes_exclusive)
    output_path.write_text(json.dumps(data, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
