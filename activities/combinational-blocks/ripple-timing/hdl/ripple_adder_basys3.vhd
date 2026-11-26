-- Basys 3 top level. A = sw(15 downto 0); B = preset chosen by btnL/btnR;
-- carry-in = btnC; sum = led(15 downto 0); carry-out = decimal point of digit 0.
library ieee;
use ieee.std_logic_1164.all;

entity ripple_adder_basys3 is
    port (
        sw   : in  std_logic_vector(15 downto 0);
        btnC : in  std_logic;
        btnL : in  std_logic;
        btnR : in  std_logic;
        led  : out std_logic_vector(15 downto 0);
        seg  : out std_logic_vector(6 downto 0);
        dp   : out std_logic;
        an   : out std_logic_vector(3 downto 0)
    );
end entity ripple_adder_basys3;

architecture rtl of ripple_adder_basys3 is
    -- Basys 3 has only 16 switches, so operand B comes from a preset table.
    function pick_b(sel : std_logic_vector(1 downto 0)) return std_logic_vector is
        variable r : std_logic_vector(15 downto 0);
    begin
        case sel is
            when "00"   => r := x"0001";   -- no button : +1 (carry "kick")
            when "01"   => r := x"5555";   -- btnL      : alternating bits
            when "10"   => r := x"FFFF";   -- btnR      : all ones
            when others => r := x"0000";   -- both      : +0 (adds only cin)
        end case;
        return r;
    end function pick_b;

    signal b    : std_logic_vector(15 downto 0);
    signal cout : std_logic;
begin
    b <= pick_b(btnR & btnL);

    adder : entity work.ripple_adder
        generic map (N => 16)
        port map (a => sw, b => b, cin => btnC, sum => led, cout => cout);

    -- Basys 3 7-segment lines are ACTIVE-LOW.
    an  <= "1110";        -- enable digit 0 only
    seg <= "1111111";     -- all segments off
    dp  <= not cout;      -- dp lights when cout = '1'
end architecture rtl;
