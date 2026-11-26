-- 1-bit full adder: the building block of the ripple-carry adder.
-- The logic lives in a VHDL FUNCTION (function-driven combinational block).
-- TPD is a simulation-only propagation delay; synthesis ignores it.
library ieee;
use ieee.std_logic_1164.all;

entity full_adder is
    generic (TPD : time := 0 ns);
    port (
        a, b, cin : in  std_logic;
        sum, cout : out std_logic
    );
end entity full_adder;

architecture rtl of full_adder is
    -- Returns carry_out & sum
    function fa_calc(x, y, c : std_logic) return std_logic_vector is
        variable p : std_logic;              -- "propagate" term
    begin
        p := x xor y;
        return ((x and y) or (c and p)) & (p xor c);
    end function fa_calc;

    signal result : std_logic_vector(1 downto 0);
begin
    result <= fa_calc(a, b, cin);
    cout   <= result(1) after TPD;
    sum    <= result(0) after TPD;
end architecture rtl;
