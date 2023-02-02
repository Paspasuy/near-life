use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{near_bindgen, BlockHeight, BorshStorageKey, PanicOnDefault};
use near_sdk::collections::Vector;
use near_sdk::json_types::Base64VecU8;
use near_sdk::{env};
use near_sdk::serde::{Serialize, Deserialize};

const WIDTH: usize = 20;
const HEIGHT: usize = 20;
const FIELD_LEN: usize = WIDTH * HEIGHT / 8;

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Board {
    pub field: Base64VecU8,
}

impl Board {
    pub fn new() -> Self {
        Self {
            field: Base64VecU8::from(vec![0u8; FIELD_LEN]),
        }
    }
    pub fn from(field: Base64VecU8) -> Self {
        assert_eq!(FIELD_LEN, field.0.len());
        Self { field }
    }
    pub fn is_bit_set(&self, x: usize, y: usize) -> bool {
        let index = y * WIDTH + x;
        let byte_index = index / 8;
        let bit_index = index & 7;
        1 == ((self.field.0[byte_index] >> bit_index) & 1)
    }
    pub fn set_bit(&mut self, x: usize, y: usize, bit: bool) {
        let index = y * WIDTH + x;
        let byte_index = index / 8;
        let bit_index = index & 7;
        self.field.0[byte_index] |= 1u8 << bit_index;
        if !bit {
            self.field.0[byte_index] ^= 1u8 << bit_index
        }
    }
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct BoardWithBlock {
    pub board: Board,
    pub current_block_height: BlockHeight,
    pub prev_block_height: BlockHeight,
}

impl BoardWithBlock {
    pub fn new(board: Board) -> Self {
        Self {
            board,
            current_block_height: env::block_height(),
            prev_block_height: 0,
        }
    }
    pub fn step(&self) -> Self {
        let board = &self.board;
        let mut new_board = Board::new();
        let block_height = env::block_height();
        for y in 0..HEIGHT {
            for x in 0..WIDTH {
                let bit = board.is_bit_set(x, y);
                let mut sum = 0;
                for off_y in 0..3 {
                    for off_x in 0..3 {
                        if off_x == 1 && off_y == 1 {
                            continue;
                        }
                        let ny = (y + off_y + HEIGHT - 1) % HEIGHT;
                        let nx = (x + off_x + WIDTH - 1) % WIDTH; 
                        if board.is_bit_set(nx, ny) {
                            sum += 1;
                        }
                    }
                }
                if sum == 3 || sum == 2 && bit {
                    new_board.set_bit(x, y, true);
                }
            }
        }
        let prev_block_height = if self.current_block_height == block_height {
            self.prev_block_height
        } else {
            self.current_block_height
        };
        Self {
            board: new_board,
            current_block_height: block_height,
            prev_block_height,
        }
    }
}

#[derive(BorshSerialize, BorshStorageKey)]
pub enum StorageKey {
    Boards,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    pub boards: Vector<BoardWithBlock>,
}

pub type BoardIndex = u64;

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new() -> Self {
        Self {
            boards: Vector::new(StorageKey::Boards),
        }
    }
    pub fn create_board(&mut self, field: Base64VecU8) -> BoardIndex {
        let board = Board::from(field);
        let board_with_block = BoardWithBlock::new(board);
        let index = self.boards.len();
        self.boards.push(&board_with_block);
        index
    }
    pub fn get_board(&self, index: BoardIndex) -> Option<BoardWithBlock> {
        self.boards.get(index)
    }
    pub fn step(&mut self, index: BoardIndex) -> BoardWithBlock {
        let board = self.get_board(index).expect("No board??");
        let new_board = board.step();
        self.boards.replace(index, &new_board);
        new_board
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    fn debug_board(board: &Board) {
        for i in 0..HEIGHT {
            for j in 0..WIDTH {
                if board.is_bit_set(j, i) {
                    print!("■");
                } else {
                    print!(".");
                }
            }
            println!();
        }
        println!();
    }

    #[test]
    fn board_create_get() {
        let mut contract = Contract::new();
        let mut field = vec![0u8; FIELD_LEN];
        field[0] = 24;
        let index = contract.create_board(field.clone().into());
        assert_eq!(index, 0);
        let b2 = contract.get_board(0).unwrap();
        assert_eq!(b2.board.field.0, field);
        debug_board(&b2.board);
    }
/*    #[test]
    fn board_step() {
        let mut contract = Contract::new();
        let mut field = vec![0u8; FIELD_LEN];
        field[0] = 4;
        field[WIDTH / 8] = 5;
        field[2 * WIDTH / 8] = 6;
        let field = Base64VecU8::from(field);
        let serialized: String = near_sdk::serde_json::to_string(&field).unwrap();
        println!("{}", serialized);
        let index = contract.create_board(field.clone());
        assert_eq!(index, 0);
        debug_board(&Board::from(field));
        let b2 = contract.step(index);
        debug_board(&b2.board);
        assert_eq!(b2.board.field.0[0], 2);
        assert_eq!(b2.board.field.0[WIDTH / 8], 12);
        assert_eq!(b2.board.field.0[2 * WIDTH / 8], 6);
    }*/
    #[test]
    fn get_pulsar_encoded() {
        let mut contract = Contract::new();
        let mut brd = Board::new();
        brd.set_bit(5, 3, true); brd.set_bit(6, 3, true); brd.set_bit(7, 3, true);
        brd.set_bit(5, 8, true); brd.set_bit(6, 8, true); brd.set_bit(7, 8, true);
        brd.set_bit(3, 5, true); brd.set_bit(3, 6, true); brd.set_bit(3, 7, true);
        brd.set_bit(8, 5, true); brd.set_bit(8, 6, true); brd.set_bit(8, 7, true);

        brd.set_bit(5, 10, true); brd.set_bit(6, 10, true); brd.set_bit(7, 10, true);
        brd.set_bit(5, 15, true); brd.set_bit(6, 15, true); brd.set_bit(7, 15, true);
        brd.set_bit(3, 11, true); brd.set_bit(3, 12, true); brd.set_bit(3, 13, true);
        brd.set_bit(8, 11, true); brd.set_bit(8, 12, true); brd.set_bit(8, 13, true);

        brd.set_bit(11, 3, true); brd.set_bit(12, 3, true); brd.set_bit(13, 3, true);
        brd.set_bit(11, 8, true); brd.set_bit(12, 8, true); brd.set_bit(13, 8, true);
        brd.set_bit(10, 5, true); brd.set_bit(10, 6, true); brd.set_bit(10, 7, true);
        brd.set_bit(15, 5, true); brd.set_bit(15, 6, true); brd.set_bit(15, 7, true);

        brd.set_bit(11, 10, true); brd.set_bit(12, 10, true); brd.set_bit(13, 10, true);
        brd.set_bit(11, 15, true); brd.set_bit(12, 15, true); brd.set_bit(13, 15, true);
        brd.set_bit(10, 11, true); brd.set_bit(10, 12, true); brd.set_bit(10, 13, true);
        brd.set_bit(15, 11, true); brd.set_bit(15, 12, true); brd.set_bit(15, 13, true);

        let serialized: String = near_sdk::serde_json::to_string(&brd.field).unwrap();
        println!("{}", serialized);
        debug_board(&brd);
        let mut tmp = BoardWithBlock::new(brd);
        let tmp = tmp.step();
        let tmp = tmp.step();
        let tmp = tmp.step();
        debug_board(&tmp.board);
    }
    /*
    #[test]
    fn get_blink_encoded() {
        let mut contract = Contract::new();
        let mut brd = Board::new();
        brd.set_bit(1, 0, true); brd.set_bit(1, 1, true); brd.set_bit(1, 2, true);

        let serialized: String = near_sdk::serde_json::to_string(&brd.field).unwrap();
        println!("{}", serialized);
        debug_board(&brd);
        let tmp = BoardWithBlock::new(brd);
        let b2 = tmp.step();
        debug_board(&b2.board);
    }*/
    #[test]
    fn get_glider_encoded() {
        let mut contract = Contract::new();
        let mut brd = Board::new();
        brd.set_bit(0, 1, true); brd.set_bit(1, 2, true);
        brd.set_bit(2, 2, true);
        brd.set_bit(2, 1, true);
        brd.set_bit(2, 0, true);

        let serialized: String = near_sdk::serde_json::to_string(&brd.field).unwrap();
        println!("{}", serialized);
        debug_board(&brd);
        let tmp = BoardWithBlock::new(brd);
        let b2 = tmp.step();
        debug_board(&b2.board);
    }
}
