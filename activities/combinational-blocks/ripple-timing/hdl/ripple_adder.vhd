-- N-bit ripple-carry adder built ONLY by wiring full_adder blocks together
-- with named port mapping. Default N = 16 gives a long carry chain.
library ieee;
use ieee.std_logic_1164.all;

entity ripple_adder is
    generic (
        N   : positive := 16;
        TPD : time     := 0 ns             -- per-stage delay for simulation
    );
    port (
        a, b : in  std_logic_vector(N-1 downto 0);
        cin  : in  std_logic;
        sum  : out std_logic_vector(N-1 downto 0);
        cout : out std_logic
    );
end entity ripple_adder;

architecture structural of ripple_adder is
    signal carry : std_logic_vector(N downto 0);   -- carry(i) = carry INTO stage i
begin
    carry(0) <= cin;

    stage : for i in 0 to N-1 generate
        fa : entity work.full_adder
            generic map (TPD => TPD)
            port map (                             -- port mapping by name
                a    => a(i),
                b    => b(i),
                cin  => carry(i),
                sum  => sum(i),
                cout => carry(i+1)                 -- feeds the next stage's cin
            );
    end generate stage;

    cout <= carry(N);
end architecture structural;
