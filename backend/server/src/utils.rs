pub fn check_required_complete(complete_mask: i32, required_steps: &Vec<i32>) -> bool {
	let mut required_complete = true;
	for step in required_steps {
		if (complete_mask & (1 << step)) == 0 {
			required_complete = false;
			break;
		}
	}
	return required_complete;
}

pub fn check_n_complete(complete_mask: i32, num_nodes: i32) -> bool {
	// one of the nodes will be the complete event which is never marked as completed before this function is called
	return complete_mask.trailing_ones() == (num_nodes - 1) as u32;
}

pub fn gen_random_token() -> String {
	// TODO: maybe use something else
	return uuid::Uuid::new_v4().to_string();
}

#[cfg(test)]
mod utils_test {
	use super::*;
	#[test]
	fn complete_mask_check_true_test(){
		let steps: Vec<i32> = vec![0, 3, 7];
		let complete_mask = 0x89i32;
		assert_eq!(check_required_complete(complete_mask, &steps), true);
	}

	#[test]
	fn complete_mask_check_false_test(){
		// 1 is not completed
		let steps: Vec<i32> = vec![0, 1, 3, 7];
		let complete_mask = 0x89i32;
		assert_eq!(check_required_complete(complete_mask, &steps), false);
	}

	#[test]
	fn check_n_complete_works(){
		// 1st node is initiate and 4th node is complete
		let num_nodes = 4;
		let complete_mask = 0x7i32;
		assert_eq!(check_n_complete(complete_mask, num_nodes), true);

		let complete_mask = 0x5i32;
		assert_eq!(check_n_complete(complete_mask, num_nodes), false);
	}

	#[test]
	fn check_token_gen() {
		let userid = uuid::Uuid::new_v4();
		let res = gen_random_token();
		// 36+1+36 chars
		assert_eq!(res.len(), 36);
	}
}
