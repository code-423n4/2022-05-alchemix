// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.11;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title ERC20Mock
///
/// @dev A mock of an ERC20 token which lets anyone burn and mint tokens.
contract ERC20Mock is ERC20 {
  uint8 public dec;

  constructor(
    string memory _name,
    string memory _symbol,
    uint8 mockDecimals
  ) ERC20(_name, _symbol) {
    dec = mockDecimals;
  }

  function decimals() public view override returns (uint8) {
    return dec;
  }

  function mint(address _recipient, uint256 _amount) external returns (bool) {
    _mint(_recipient, _amount);
    return true;
  }

  function burn(uint256 _amount) external {
    _burn(msg.sender, _amount);
  }

  function burn(address _account, uint256 _amount) external {
    _burn(_account, _amount);
  }
}
