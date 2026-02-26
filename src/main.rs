use std::{thread, time::Duration};

use ai_world::colony::Colony;

fn main() {
    let mut colony = Colony::demo();

    for _ in 0..40 {
        colony.tick();
        print!("\x1B[2J\x1B[1;1H");
        println!("{}", colony.render_ui());
        thread::sleep(Duration::from_millis(180));
    }

    println!(
        "\nSimulation finished. Final berries stored: {}",
        colony.stockpile_berries
    );
}
