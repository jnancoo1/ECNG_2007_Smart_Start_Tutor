library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity tb_parity_generator is
end entity;

architecture test of tb_parity_generator is
    signal data_in    : std_logic_vector(2 downto 0);
    signal odd_mode   : std_logic;
    signal parity_bit : std_logic;
begin
    dut : entity work.parity_generator(rtl)
        port map (data_in => data_in, odd_mode => odd_mode, parity_bit => parity_bit);

    process
        variable ones : natural;
    begin
        for word in 0 to 7 loop
            data_in <= std_logic_vector(to_unsigned(word, data_in'length));
            for mode in 0 to 1 loop
                if mode = 0 then
                    odd_mode <= '0';
                else
                    odd_mode <= '1';
                end if;
                wait for 10 ns;
                ones := 0;
                for i in data_in'range loop
                    if data_in(i) = '1' then
                        ones := ones + 1;
                    end if;
                end loop;
                if parity_bit = '1' then
                    ones := ones + 1;
                end if;
                assert (parity_bit = '0' or parity_bit = '1') and (ones mod 2 = mode)
                    report "Parity failed for input " & integer'image(word)
                         & ", mode " & integer'image(mode)
                    severity failure;
            end loop;
        end loop;
        report "All 16 parity cases passed" severity note;
        wait;
    end process;
end architecture;
