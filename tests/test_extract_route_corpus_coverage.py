from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "tools" / "extract_route_corpus_coverage.py"
MODULE_SPEC = importlib.util.spec_from_file_location("extract_route_corpus_coverage", MODULE_PATH)
extract_route_corpus_coverage = importlib.util.module_from_spec(MODULE_SPEC)
assert MODULE_SPEC and MODULE_SPEC.loader
MODULE_SPEC.loader.exec_module(extract_route_corpus_coverage)


class ExtractRouteCorpusCoverageTests(unittest.TestCase):
    def write_json(self, path: Path, value) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value), encoding="utf-8")

    def route(
        self,
        route_id: str,
        *,
        centre_name: str,
        coords: dict[str, float],
        difficulty: str = "hard",
        family: str = "urban",
        zones: list[str] | None = None,
        roads: list[str] | None = None,
        validation_flags: list[str] | None = None,
        quality: float = 0.85,
        distance_meters: int | None = 12000,
        duration_seconds: int | None = 1800,
        source_pdf_name: str = "pack-a.pdf",
        use_alt_metric_keys: bool = False,
    ) -> dict:
        route = {
            "id": route_id,
            "name": f"Route {route_id}",
            "centreName": centre_name,
            "centreCoordinates": coords,
            "difficultyLevel": difficulty,
            "routeFamily": family,
            "routeZones": zones or ["Zone A"],
            "roadsUsed": roads or ["High Street"],
            "validationFlags": validation_flags or ["validated"],
            "qualityScore": quality,
            "sourcePdfName": source_pdf_name,
        }
        if use_alt_metric_keys:
            route["distanceM"] = distance_meters
            route["durationS"] = duration_seconds
        else:
            route["distanceMeters"] = distance_meters
            route["estimatedDurationSeconds"] = duration_seconds
        return route

    def test_extract_coverage_filters_noise_and_aliases(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            output_root = Path(tmpdir)
            coords = {"lat": 51.5412347, "lon": 0.0812349}

            self.write_json(
                output_root / "barking_tanner_st" / "routes.json",
                [
                    self.route("canonical-1", centre_name="Barking Tanner St", coords=coords, quality=0.9),
                    self.route("canonical-2", centre_name="Barking Tanner St", coords=coords, quality=0.8),
                    self.route("canonical-3", centre_name="Barking Tanner St", coords=coords, quality=0.7),
                ],
            )
            self.write_json(
                output_root / "barking_tanner_st" / "validation_report.json",
                {
                    "candidates": 5,
                    "validated": 4,
                    "selected": 3,
                    "matched_hint_roads": 2,
                    "hint_coverage": {"ratio": 0.6666},
                    "route_shape": {
                        "family_counts": {"urban": 3},
                        "zones": ["Zone A", "Zone B"],
                    },
                    "rejection_counts": {"duplicate": 1},
                },
            )
            self.write_json(
                output_root / "barking_tanner_street" / "routes.json",
                [
                    self.route("alias-1", centre_name="Barking Tanner Street", coords=coords, quality=0.95),
                    self.route("alias-2", centre_name="Barking Tanner Street", coords=coords, quality=0.92),
                    self.route("alias-3", centre_name="Barking Tanner Street", coords=coords, quality=0.91),
                ],
            )
            self.write_json(
                output_root / "blackpool_temp_2026" / "routes.json",
                [
                    self.route("temp-1", centre_name="Blackpool", coords={"lat": 53.8, "lon": -3.0}),
                    self.route("temp-2", centre_name="Blackpool", coords={"lat": 53.8, "lon": -3.0}),
                    self.route("temp-3", centre_name="Blackpool", coords={"lat": 53.8, "lon": -3.0}),
                ],
            )
            self.write_json(
                output_root / "tiny_centre" / "routes.json",
                [
                    self.route("tiny-1", centre_name="Tiny Centre", coords={"lat": 52.0, "lon": -0.1}),
                    self.route("tiny-2", centre_name="Tiny Centre", coords={"lat": 52.0, "lon": -0.1}),
                ],
            )

            data = extract_route_corpus_coverage.extract_coverage(output_root, min_routes_exclusive=2)

        self.assertEqual(data["source"]["type"], "route-corpus")
        self.assertEqual(data["summary"]["centres"], 1)
        self.assertEqual(data["summary"]["routes"], 3)
        self.assertEqual(data["summary"]["aliasCount"], 1)
        self.assertEqual(data["summary"]["excludedCount"], 2)

        self.assertEqual(
            data["aliases"],
            [
                {
                    "id": "barking_tanner_street",
                    "canonicalId": "barking_tanner_st",
                    "reason": "duplicate_centre_variant",
                }
            ],
        )

        excluded_by_id = {item["id"]: item for item in data["excluded"]}
        self.assertEqual(excluded_by_id["blackpool_temp_2026"]["reason"], "temporary_variant")
        self.assertEqual(excluded_by_id["tiny_centre"]["reason"], "insufficient_routes")

        centre = data["centres"][0]
        self.assertEqual(centre["id"], "barking_tanner_st")
        self.assertEqual(centre["slug"], "barking-tanner-st")
        self.assertEqual(centre["url"], "/driving-test-centres/barking-tanner-st")
        self.assertEqual(centre["coordinates"], {"lat": 51.541235, "lon": 0.081235})
        self.assertEqual(centre["validation"]["candidates"], 5)
        self.assertEqual(centre["validation"]["validated"], 4)
        self.assertEqual(centre["validation"]["selected"], 3)
        self.assertEqual(centre["validation"]["matchedHintRoads"], 2)
        self.assertEqual(centre["validation"]["hintCoverageRatio"], 0.667)
        self.assertEqual(centre["validation"]["familyCounts"], {"urban": 3})
        self.assertEqual(centre["validation"]["zones"], ["Zone A", "Zone B"])
        self.assertEqual(centre["validation"]["rejectionCounts"], {"duplicate": 1})

    def test_summarise_routes_supports_primary_and_fallback_metric_fields(self) -> None:
        coords = {"lat": 55.95, "lon": -3.19}
        routes = [
            self.route(
                "best",
                centre_name="Edinburgh Currie",
                coords=coords,
                difficulty="hard",
                family="urban",
                zones=["Zone A", "Zone B"],
                roads=["Lanark Road", "Bridge Road"],
                quality=0.95,
                distance_meters=15000,
                duration_seconds=2100,
                source_pdf_name="pack-a.pdf",
            ),
            self.route(
                "fallback",
                centre_name="Edinburgh Currie",
                coords=coords,
                difficulty="hard",
                family="urban",
                zones=["Zone A"],
                roads=["Lanark Road"],
                quality=0.8,
                distance_meters=9000,
                duration_seconds=1500,
                source_pdf_name="pack-b.pdf",
                use_alt_metric_keys=True,
            ),
            self.route(
                "lower",
                centre_name="Edinburgh Currie",
                coords=coords,
                difficulty="easy",
                family="rural",
                zones=["Zone C"],
                roads=["Bypass"],
                validation_flags=["manual_review"],
                quality=0.6,
                distance_meters=12000,
                duration_seconds=1800,
                source_pdf_name="pack-a.pdf",
            ),
        ]

        summary = extract_route_corpus_coverage.summarise_routes(routes)

        self.assertEqual(summary["routeCount"], 3)
        self.assertEqual(summary["averageDistanceKm"], 12.0)
        self.assertEqual(summary["averageDurationMinutes"], 30.0)
        self.assertEqual(summary["averageQualityScore"], 0.783)
        self.assertEqual(summary["minDistanceKm"], 9.0)
        self.assertEqual(summary["maxDistanceKm"], 15.0)
        self.assertEqual(summary["minDurationMinutes"], 25.0)
        self.assertEqual(summary["maxDurationMinutes"], 35.0)
        self.assertEqual(summary["difficultyCounts"], {"easy": 1, "hard": 2})
        self.assertEqual(summary["dominantDifficulty"], "hard")
        self.assertEqual(summary["routeFamilyCounts"], {"rural": 1, "urban": 2})
        self.assertEqual(summary["validationFlagCounts"], {"manual_review": 1, "validated": 2})
        self.assertEqual(summary["sourcePdfCount"], 2)
        self.assertEqual(summary["topZones"][0], {"name": "Zone A", "count": 2})
        self.assertEqual(summary["topRoads"][0], {"name": "Lanark Road", "count": 2})
        self.assertEqual(summary["sampleRoutes"][0]["id"], "best")
        self.assertEqual(summary["sampleRoutes"][0]["distanceKm"], 15.0)
        self.assertEqual(summary["sampleRoutes"][1]["id"], "fallback")
        self.assertEqual(summary["sampleRoutes"][1]["durationMinutes"], 25.0)


if __name__ == "__main__":
    unittest.main()
