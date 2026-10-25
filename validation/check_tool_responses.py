"""Check captured live-tool contracts; no network or third-party dependencies."""
import json
from pathlib import Path


def payload(record):
    result = record["result"]
    assert not result.get("isError"), record["kind"]
    return json.loads(next(c["text"] for c in result["content"] if c["type"] == "text"))


def main():
    records = json.loads(Path(__file__).with_name("turngreen-tool-responses.json").read_text())["records"]
    simulations = sorted((r for r in records if r["kind"] == "simulation"), key=lambda r: r["args"]["turn"])
    assert len(simulations) == 5
    previous = None
    for turn, record in enumerate(simulations, 1):
        response = payload(record)
        assert response["turn"] == turn
        state = response["next_state"]
        assert abs(sum(state["land_cover"].values()) - 100) < 0.02
        assert all(0 <= value <= 100 for value in state["land_cover"].values())
        assert state["remaining_budget"] == 500000 - turn * 100000
        if previous is not None:
            assert record["args"]["current_state"] == previous
        previous = state
        for key in ("player_summary", "player_metrics", "science_payload", "intervention"):
            assert isinstance(response[key], dict)
    by_kind = {r["kind"]: r for r in records}
    assert payload(by_kind["assessment"])["status"] == "recorded"
    assert abs(payload(by_kind["post"])["learning_gain"]["average_normalized_gain"] - 0.833) < 0.001
    science = payload(by_kind["science"])
    assert science["drawer_body_markdown"] and len(science["citations"]) == 3
    assert len(payload(by_kind["topics"])["available_topics"]) == 10
    resolution = payload(by_kind["resolution"])
    assert len(resolution["talking_points"]) == 3
    assert "<!DOCTYPE html>" in resolution["single_page_html"]
    assert resolution["resolution_markdown"]
    for kind in ("invalid-score", "unknown-topic", "invalid-turn", "missing-baseline"):
        assert by_kind[kind]["result"]["isError"] is True
    ceiling = payload(by_kind["ceiling"])["learning_gain"]
    assert ceiling["average_normalized_gain"] == 0
    assert ceiling["gain_type"] == "ceiling_effect"
    assert payload(by_kind["overspend"])["intervention"]["budget_capped"] is True
    roof = payload(simulations[2])["next_state"]["roof_treatment_hectares"]
    assert roof > 0
    for record in simulations[3:]:
        assert payload(record)["next_state"]["roof_treatment_hectares"] == roof
    for record in simulations:
        flood = payload(record)["science_payload"]["invest_urban_flood"]
        expected = (flood["baseline_runoff_mm"] - flood["post_runoff_mm"]) * 500
        assert abs(expected - flood["incremental_runoff_reduction_m3"]) < 1
    final_flood = payload(simulations[-1])["science_payload"]["invest_urban_flood"]
    assert abs(resolution["biophysical_scorecard"]["total_stormwater_retained_m3"] - final_flood["stormwater_retained_m3"]) < 1
    assert abs(resolution["biophysical_scorecard"]["rooftop_treated_ha"] - roof) < 0.01
    scorecard = resolution["biophysical_scorecard"]
    supplied = by_kind["resolution"]["args"]["session_history"]["final_metrics"]
    assert abs(scorecard["baseline_runoff_reduction_m3"] - supplied["baseline_runoff_reduction_m3"]) < 1
    assert abs(scorecard["net_built_up_reduced_ha"] - supplied["net_built_up_reduced_ha"]) < 0.01
    assert scorecard["total_ground_interventions_ha"] > scorecard["net_built_up_reduced_ha"]
    print("PASS: captured contracts, five-turn state chain, assessment, science, resolution, and expected error envelopes.")
    print("Known semantic defects remain; see Docs/TOOL_VALIDATION.md. This is not a live-server rerun.")


if __name__ == "__main__":
    main()
