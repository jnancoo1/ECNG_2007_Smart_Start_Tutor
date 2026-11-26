# Digilent Basys 3 rev B. SW2..SW0 carry the word, SW3 selects odd mode.
set_property -dict {PACKAGE_PIN V17 IOSTANDARD LVCMOS33} [get_ports {data_in[0]}]
set_property -dict {PACKAGE_PIN V16 IOSTANDARD LVCMOS33} [get_ports {data_in[1]}]
set_property -dict {PACKAGE_PIN W16 IOSTANDARD LVCMOS33} [get_ports {data_in[2]}]
set_property -dict {PACKAGE_PIN W17 IOSTANDARD LVCMOS33} [get_ports odd_mode]
set_property -dict {PACKAGE_PIN U16 IOSTANDARD LVCMOS33} [get_ports parity_bit]
