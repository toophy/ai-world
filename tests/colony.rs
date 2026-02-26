use ai_world::colony::Colony;

#[test]
fn colonists_collect_and_deliver_berries() {
    let mut colony = Colony::demo();
    for _ in 0..120 {
        colony.tick();
    }

    assert!(
        colony.stockpile_berries > 0,
        "expected some berries delivered"
    );
    let remaining: u32 = colony.bushes.iter().map(|b| b.berries_left).sum();
    assert!(remaining < 18, "expected bushes to be harvested over time");
}

#[test]
fn ui_contains_core_panels() {
    let mut colony = Colony::demo();
    colony.tick();
    let ui = colony.render_ui();
    assert!(ui.contains("Colonists"));
    assert!(ui.contains("Automation"));
    assert!(ui.contains("Berry Fields"));
}
