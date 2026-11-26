-- Self-checking testbench. TPD = 1 ns per stage so settle time is visible.
-- The directed vectors are 16 bits wide, so keep N = 16.
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use ieee.math_real.all;

entity tb_ripple_adder is
end entity tb_ripple_adder;

architecture sim of tb_ripple_adder is
    constant N   : positive := 16;
    constant TPD : time     := 1 ns;
    signal a, b  : std_logic_vector(N-1 downto 0) := (others => '0');
    signal cin   : std_logic := '0';
    signal sum   : std_logic_vector(N-1 downto 0);
    signal cout  : std_logic;
begin
    dut : entity work.ripple_adder
        generic map (N => N, TPD => TPD)
        port map (a => a, b => b, cin => cin, sum => sum, cout => cout);

    stim : process
        variable errors         : natural := 0;
        variable t_apply, t_last: time;
        variable seed1          : positive := 7;
        variable seed2          : positive := 13;
        variable r1, r2, r3     : real;

        procedure apply(ta, tb : in std_logic_vector(N-1 downto 0); tc : in std_logic) is
            variable total    : integer;
            variable expected : unsigned(N downto 0);
        begin
            a <= ta; b <= tb; cin <= tc;
            t_apply := now; t_last := now;
            loop                                   -- wait until outputs stop changing
                wait on sum, cout for 4*N*TPD;
                if sum'event or cout'event then
                    t_last := now;
                else
                    exit;
                end if;
            end loop;
            total := to_integer(unsigned(ta)) + to_integer(unsigned(tb));
            if tc = '1' then total := total + 1; end if;
            expected := to_unsigned(total, N+1);
            if std_logic_vector(expected) /= (cout & sum) then
                errors := errors + 1;
                report "FAIL: wrong result for " & integer'image(to_integer(unsigned(ta))) &
                       " + " & integer'image(to_integer(unsigned(tb))) severity error;
            end if;
            report integer'image(to_integer(unsigned(ta))) & " + " &
                   integer'image(to_integer(unsigned(tb))) & " + " & std_logic'image(tc) &
                   " settled after " & time'image(t_last - t_apply);
        end procedure apply;
    begin
        wait for 4*N*TPD;
        apply(x"0001", x"0000", '0');      -- little or no carry movement
        apply(x"FFFF", x"0001", '0');      -- worst case: carry ripples through all N stages
        apply(x"AAAA", x"5555", '1');      -- every stage propagates; cin ripples through
        for k in 1 to 200 loop
            uniform(seed1, seed2, r1);
            uniform(seed1, seed2, r2);
            uniform(seed1, seed2, r3);
            if r3 > 0.5 then
                apply(std_logic_vector(to_unsigned(integer(r1 * real(2**N - 1)), N)),
                      std_logic_vector(to_unsigned(integer(r2 * real(2**N - 1)), N)), '1');
            else
                apply(std_logic_vector(to_unsigned(integer(r1 * real(2**N - 1)), N)),
                      std_logic_vector(to_unsigned(integer(r2 * real(2**N - 1)), N)), '0');
            end if;
        end loop;
        if errors = 0 then
            report "PASS: all vectors correct";
        else
            report "FAIL: " & integer'image(errors) & " errors" severity error;
        end if;
        wait;                                  -- end of test
    end process stim;
end architecture sim;
