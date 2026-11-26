library ieee;
use ieee.std_logic_1164.all;

entity parity_generator is
    port (
        data_in    : in  std_logic_vector(2 downto 0);
        odd_mode   : in  std_logic;  -- 0 selects even parity, 1 selects odd
        parity_bit : out std_logic
    );
end entity;

architecture rtl of parity_generator is
begin
    parity_bit <= data_in(2) xor data_in(1) xor data_in(0) xor odd_mode;
end architecture;
