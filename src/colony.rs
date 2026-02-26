use std::collections::VecDeque;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Position {
    pub x: i32,
    pub y: i32,
}

impl Position {
    pub fn step_towards(self, target: Position) -> Position {
        let mut x = self.x;
        let mut y = self.y;
        if target.x > self.x {
            x += 1;
        } else if target.x < self.x {
            x -= 1;
        }
        if target.y > self.y {
            y += 1;
        } else if target.y < self.y {
            y -= 1;
        }
        Position { x, y }
    }

    pub fn distance_to(self, other: Position) -> i32 {
        (self.x - other.x).abs() + (self.y - other.y).abs()
    }
}

#[derive(Debug, Clone)]
pub struct BerryBush {
    pub id: usize,
    pub position: Position,
    pub berries_left: u32,
}

#[derive(Debug, Clone)]
pub enum TaskKind {
    HarvestBerry { bush_id: usize },
    DeliverToStockpile,
    IdlePatrol,
}

#[derive(Debug, Clone)]
pub struct Task {
    pub kind: TaskKind,
    pub target: Position,
    pub priority: u8,
}

#[derive(Debug, Clone)]
pub struct Pawn {
    pub name: String,
    pub position: Position,
    pub carry: u32,
    pub capacity: u32,
    pub current_task: Option<Task>,
}

impl Pawn {
    fn is_idle(&self) -> bool {
        self.current_task.is_none()
    }
}

#[derive(Debug)]
pub struct Colony {
    pub tick: u64,
    pub stockpile_berries: u32,
    pub stockpile: Position,
    pub bushes: Vec<BerryBush>,
    pub pawns: Vec<Pawn>,
    task_queue: VecDeque<Task>,
}

impl Colony {
    pub fn demo() -> Self {
        Self {
            tick: 0,
            stockpile_berries: 0,
            stockpile: Position { x: 5, y: 5 },
            bushes: vec![
                BerryBush {
                    id: 0,
                    position: Position { x: 12, y: 4 },
                    berries_left: 10,
                },
                BerryBush {
                    id: 1,
                    position: Position { x: 2, y: 14 },
                    berries_left: 8,
                },
            ],
            pawns: vec![
                Pawn {
                    name: "Ava".to_string(),
                    position: Position { x: 1, y: 1 },
                    carry: 0,
                    capacity: 5,
                    current_task: None,
                },
                Pawn {
                    name: "Bo".to_string(),
                    position: Position { x: 8, y: 1 },
                    carry: 0,
                    capacity: 5,
                    current_task: None,
                },
                Pawn {
                    name: "Cy".to_string(),
                    position: Position { x: 1, y: 8 },
                    carry: 0,
                    capacity: 5,
                    current_task: None,
                },
            ],
            task_queue: VecDeque::new(),
        }
    }

    pub fn tick(&mut self) {
        self.tick += 1;
        self.generate_tasks();
        self.assign_tasks();
        self.update_pawns();
    }

    fn generate_tasks(&mut self) {
        for bush in &self.bushes {
            if bush.berries_left > 0 && !self.has_task_for_bush(bush.id) {
                self.task_queue.push_back(Task {
                    kind: TaskKind::HarvestBerry { bush_id: bush.id },
                    target: bush.position,
                    priority: 10,
                });
            }
        }

        let idle_count = self.pawns.iter().filter(|p| p.is_idle()).count();
        for _ in 0..idle_count {
            if self.task_queue.is_empty() {
                self.task_queue.push_back(Task {
                    kind: TaskKind::IdlePatrol,
                    target: Position {
                        x: (self.tick % 10) as i32,
                        y: ((self.tick / 2) % 10) as i32,
                    },
                    priority: 1,
                });
            }
        }
    }

    fn has_task_for_bush(&self, bush_id: usize) -> bool {
        self.task_queue.iter().any(|task| {
            matches!(task.kind, TaskKind::HarvestBerry { bush_id: id } if id == bush_id)
        }) || self
            .pawns
            .iter()
            .any(|pawn| matches!(pawn.current_task.as_ref().map(|t| &t.kind), Some(TaskKind::HarvestBerry { bush_id: id }) if *id == bush_id))
    }

    fn assign_tasks(&mut self) {
        while let Some(task) = self.pop_best_task() {
            if let Some((idx, _)) = self
                .pawns
                .iter()
                .enumerate()
                .filter(|(_, p)| p.is_idle())
                .min_by_key(|(_, p)| p.position.distance_to(task.target))
            {
                self.pawns[idx].current_task = Some(task);
            } else {
                self.task_queue.push_front(task);
                break;
            }
        }

        for pawn in &mut self.pawns {
            if pawn.carry >= pawn.capacity
                && !matches!(
                    pawn.current_task.as_ref().map(|t| &t.kind),
                    Some(TaskKind::DeliverToStockpile)
                )
            {
                pawn.current_task = Some(Task {
                    kind: TaskKind::DeliverToStockpile,
                    target: self.stockpile,
                    priority: 20,
                });
            }
        }
    }

    fn pop_best_task(&mut self) -> Option<Task> {
        let mut best_idx = None;
        let mut best_priority = 0;
        for (i, t) in self.task_queue.iter().enumerate() {
            if t.priority >= best_priority {
                best_priority = t.priority;
                best_idx = Some(i);
            }
        }
        best_idx.and_then(|idx| self.task_queue.remove(idx))
    }

    fn update_pawns(&mut self) {
        for pawn in &mut self.pawns {
            let Some(task) = pawn.current_task.clone() else {
                continue;
            };

            if pawn.position != task.target {
                pawn.position = pawn.position.step_towards(task.target);
                continue;
            }

            match task.kind {
                TaskKind::HarvestBerry { bush_id } => {
                    if let Some(bush) = self
                        .bushes
                        .iter_mut()
                        .find(|b| b.id == bush_id && b.berries_left > 0)
                    {
                        bush.berries_left -= 1;
                        pawn.carry += 1;
                        if pawn.carry >= pawn.capacity || bush.berries_left == 0 {
                            pawn.current_task = Some(Task {
                                kind: TaskKind::DeliverToStockpile,
                                target: self.stockpile,
                                priority: 20,
                            });
                        }
                    } else {
                        pawn.current_task = None;
                    }
                }
                TaskKind::DeliverToStockpile => {
                    self.stockpile_berries += pawn.carry;
                    pawn.carry = 0;
                    pawn.current_task = None;
                }
                TaskKind::IdlePatrol => {
                    pawn.current_task = None;
                }
            }
        }
    }

    pub fn render_ui(&self) -> String {
        let mut lines = vec![
            "╔════════════════ RimWorld-like Colony Console ════════════════╗".to_string(),
            format!(
                "║ Tick {:>4}  Stockpile Berries: {:>3}  Queue: {:>2}                ║",
                self.tick,
                self.stockpile_berries,
                self.task_queue.len()
            ),
            "╠══════════════ Colonists ══════════════╦═════════ Automation ═══╣".to_string(),
        ];

        for pawn in &self.pawns {
            let task = match pawn.current_task.as_ref().map(|t| &t.kind) {
                Some(TaskKind::HarvestBerry { bush_id }) => format!("Harvest bush #{bush_id}"),
                Some(TaskKind::DeliverToStockpile) => "Deliver cargo".to_string(),
                Some(TaskKind::IdlePatrol) => "Patrol".to_string(),
                None => "Idle".to_string(),
            };
            lines.push(format!(
                "║ {:<8} @ ({:>2},{:>2}) carry {:>2}/{:<2} ║ {:<21} ║",
                pawn.name, pawn.position.x, pawn.position.y, pawn.carry, pawn.capacity, task
            ));
        }

        lines
            .push("╠══════════════ Berry Fields ═══════════╩════════════════════════╣".to_string());
        for bush in &self.bushes {
            lines.push(format!(
                "║ Bush #{:<2} at ({:>2},{:>2}) remaining berries: {:>2}                  ║",
                bush.id, bush.position.x, bush.position.y, bush.berries_left
            ));
        }
        lines.push(
            "╚═════════════════════════════════════════════════════════════════╝".to_string(),
        );
        lines.join("\n")
    }
}
